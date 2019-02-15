const needle = require('needle')
const videoNameParser = require('video-name-parser')
const pUrl = require('url')
const httpProxy = require('http-proxy')
const proxies = []

const ticker = {}

const helper = {

    setTicker: function(ticks, cb) {

        const tag = Date.now()

        ticker[tag] = ticks

        return function() {
            ticker[tag]--
            if (!ticker[tag] && ticker.hasOwnProperty(tag)) {
                delete ticker[tag]
                cb()
            }
        }
    },

    episodeTag: (season, episode) => {
        return 'S' + ('0' + season).slice(-2) + 'E' + ('0' + episode).slice(-2)
    },

    simpleName: (name) => {

        // Warning: black magic ahead

        name = name.replace(/\.|_|\-|\–|\(|\)|\[|\]|\:|\,/g, ' ') // remove all unwanted characters
        name = name.replace(/\s+/g, ' ') // remove duplicate spaces
        name = name.replace(/\\\\/g, '\\').replace(new RegExp('\\\\\'|\\\'|\\\\\"|\\\"', 'g'), '') // remove escaped quotes

        return name
    },

    isValid: (filename, queryName, epTag) => {

        // make sure the filename includes the search query and episode tag (if applicable)

        let valid = true

        filename = helper.simpleName(filename)
        queryName = helper.simpleName(queryName)

        const queryWords = queryName.split(' ')

        queryWords.some((word) => {
            if (!filename.toLowerCase().includes(word.toLowerCase())) {
                valid = false
                return true
            }
        })

        return valid

    },


    proxy: function(url, referer, cb) {

        // check if we already made a proxy for it

        const urlParser = pUrl.parse(url)

        if (proxies && proxies.length) {
            const foundProxy = proxies.some((proxyRes, ij) => {
                if (proxyRes.host == urlParser.host) {
                    proxies[ij].paths.push({
                        path: urlParser.path, referer
                    })
                    cb('http://127.0.0.1:' + proxyRes.port + (urlParser.path || ''))
                    return true
                }
            })

            if (foundProxy)
                return
        }

        // create the proxy

        const proxy = httpProxy.createProxyServer()

        proxy.on('error', function(e) {
            if (e && log) {
                log('http proxy error')
                log(e)
            }
        })

        let proxyId = -1

        const configProxy = { target: urlParser.protocol+'//'+urlParser.host }

        configProxy.headers = {
            host: urlParser.host,
            referer: referer,
            agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/610.0.3239.132 Safari/537.36'
        }

        if (urlParser.protocol == 'https:')
            configProxy.agent = require('https').globalAgent

        const srv = require('http').createServer(function (req, res) {
            req.headers['host'] = configProxy.headers.host

            let didReferer = false

            if (proxyId > -1 && req.url)
                didReferer = proxies[proxyId].paths.some((thisPath) => {
                    if (thisPath.path == req.url) {
                        req.headers['referer'] = thisPath.referer
                        return true
                    }
                })

            if (!didReferer)
                req.headers['referer'] = configProxy.headers.referer

            req.headers['user-agent'] = configProxy.headers.agent
            res.setHeader('Access-Control-Allow-Origin', '*')
            proxy.web(req, res, configProxy);
        })

        srv.listen()

        srv.on('error', function(e) {
            console.log('http proxy error')
            console.log(e)
        })

        srv.on('connection', function(socket) {
            socket.setTimeout(Number.MAX_SAFE_INTEGER);
        })

        srv.on('listening',function() {
            proxies.push({
                host: urlParser.host,
                port: srv.address().port,
                paths: [
                    {
                        path: urlParser.pathname,
                        referer
                    }
                ]
            })
            proxyId = proxies.length -1
            cb('http://127.0.0.1:' + srv.address().port + (urlParser.path || ''))
        })

    },

    proxify: function(streams, cb) {

        if (!streams && !streams.length)
            return cb(null, [])

        const endResults = []

        var tick = helper.setTicker(streams.length, () => {
            cb(null, endResults)
        })

        streams.forEach((elm) => {

            if (!elm || !elm.url)
                return tick()

            helper.proxy(elm.url, elm.url, newUrl => {
                elm.url = newUrl
                endResults.push(elm)
                tick()
            })
        })

    },

}

module.exports = helper
