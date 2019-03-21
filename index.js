
const needle = require('needle')
const getPort = require('get-port')

const openDirApi = require('./openDirectories')
const tunnel = require('./tunnel')
const helper = require('./helpers')

const config = require('./config')

const autoLaunch = require('./autoLaunch')

const version = require('./package.json').version

autoLaunch('Open Music Add-on', config.autoLaunch)

const pUrl = require('url')

const manifest = { 
    "id": "org.stremio.opendirmusic",
    "version": version,

    "name": "Stremio Open Music Addon",
    "description": "Stremio Add-on to get music streaming results from Open Directories",

    "icon": "https://secure.webtoolhub.com/static/resources/logos/set1/bc185e1e.jpg",

    // set what type of resources we will return
    "resources": [
        "stream", "meta", "catalog"
    ],

    "catalogs": [
        {
            id: "opendirmusic",
            type: "tv",
            extraSupported: ["search"],
            extraRequired: ["search"]
        }
    ],

    // works for both movies and series
    "types": ["tv"],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": [ "openmusic:" ]

}

const addonSDK = require("stremio-addon-sdk")
const addon = new addonSDK(manifest)

const toStream = (newObj, type) => {
    return {
        name: pUrl.parse(newObj.href).host,
        type: type,
        url: newObj.href,
        // presume 480p if the filename has no extra tags
        title: newObj.extraTag || '480p'
    }
}

addon.defineStreamHandler((args, cb) => {

    if (!args.id)
        return cb(null, { streams: [] })

    let results = []

    let sentResponse = false

    const respondStreams = () => {

        if (sentResponse) return
        sentResponse = true

        if (results && results.length) {

            tempResults = results

            const streams = []

            tempResults.forEach(stream => { streams.push(toStream(stream, args.type)) })

            if (streams.length) {
                if (config.remote) {
                    cb(null, { streams: streams })
                } else {
                    // use proxy to remove CORS
                    helper.proxify(streams, (err, proxiedStreams) => {
                        if (!err && proxiedStreams && proxiedStreams.length)
                            cb(null, { streams: proxiedStreams })
                        else
                            cb(null, { streams: streams })
                    })
                }
            } else {
                cb(null, { streams: [] })
            }
        } else {
            cb(null, { streams: [] })
        }
    }

    const searchQuery = {
        query: decodeURIComponent(args.id.replace('openmusic:', '')),
        type: args.type
    }

    openDirApi.search(searchQuery,

        partialResponse = (tempResults) => {
            results = results.concat(tempResults)
        },

        endResponse = (tempResults) => {
            results = tempResults
            respondStreams()
        })


    if (config.responseTimeout)
        setTimeout(respondStreams, config.responseTimeout)

})

addon.defineMetaHandler((args, cb) => {
    if (args && args.id) {

        cb(false, {
            meta: {
                id: args.id,
                name: decodeURIComponent(args.id.replace('openmusic:','')),
                type: 'tv',
                poster: 'https://secure.webtoolhub.com/static/resources/logos/set1/bc185e1e.jpg',
                posterShape: 'landscape'
            }
        })
    } else {
        cb(false, false)
    }

})

addon.defineCatalogHandler((args, cb) => {
    if (args && args.extra && args.extra.search) {
        cb(false, {
            metas: [
                {
                    id: 'openmusic:'+encodeURIComponent(args.extra.search),
                    name: args.extra.search,
                    type: 'tv',
                    poster: 'https://secure.webtoolhub.com/static/resources/logos/set1/bc185e1e.jpg',
                    posterShape: 'landscape'
                }
            ]
        })
    } else {
        cb(false, false)
    }
})

if (process && process.argv)
    process.argv.forEach((cmdLineArg) => {
        if (cmdLineArg == '--remote')
            config.remote = true
        else if (cmdLineArg == '-v') {
            // version check
            console.log('v' + version)
            process.exit()
        }
    })

const runAddon = async () => {

    config.addonPort = await getPort({ port: config.addonPort })

    addon.runHTTPWithOptions({ port: config.addonPort })

    if (config.remote) {

        const remoteOpts = {}

        if (config.subdomain)
            remoteOpts.subdomain = config.subdomain

        
        tunnel(config.addonPort, remoteOpts)
         
    }

}

runAddon()
