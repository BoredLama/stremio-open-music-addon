const needle = require('needle')
const helper = require('./helpers')
const cheerio = require('cheerio')

const config = require('./config')


if (process && process.argv)
	process.argv.forEach((cmdLineArg) => {
		if (cmdLineArg.startsWith('--google-results=')) {
			config.googleResults = parseInt(cmdLineArg.replace('--google-results=', ''))
		}
	})

const google = require('google')

google.resultsPerPage = config.googleResults

const supportedFiles = ['mp3']

module.exports = {

	search: (query, cb, end) => {


		let searchQuery = query.query

		let allReqs = 0
		let doneReqs = 0

		const results = []

		google(searchQuery + ' +(' + supportedFiles.join('|') + ') -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml) intitle:index.of -inurl:(listen77|mp3raid|mp3toss|mp3drug|index_of|wallywashis)', (err, res) => {

		  if (err) {
		  	console.log(err.message || err)
		  	end([])
		  	return
		  }

		  if (!res || !res.links) {
		  	console.log('no google results')
		  	end([])
		  	return
		  }

		  for (var i = 0; i < res.links.length; ++i) {

		    const link = res.links[i]

		    if (link.title.startsWith('Index of')) {

		    	allReqs++

				needle.get(link.href, {
					open_timeout: config.page.openTimeout,
					read_timeout: config.page.readTimeout,
					parse_response: false
				}, (err, resp) => {
					if (!err && resp && resp.body) {

						const $ = cheerio.load(resp.body)

						let found = false;

						$('a').each(function() {

							let href = $(this).prop('href') || $(this).attr('href')

							if (!href) return

							if (!href.startsWith('http:') && !href.startsWith('https:'))
								href = link.href + href

							const parts = href.split('/')
							const filename = parts[parts.length -1]
							const extension = filename.split('.').pop()

							if (helper.isValid(filename, query.query)) {

								if (supportedFiles.indexOf(extension.toLowerCase()) > -1)
									found = true

								if (found) {

									const newObj = {}

									newObj.extraTag = decodeURIComponent(filename)
									newObj.href = href
									newObj.filename = filename

									cb([newObj])

									results.push(newObj)

								}

							}

							if (found) {
								// break for loop
								return false
							}
						})

						doneReqs++

						if (allReqs == doneReqs)
							end(results)

					} else {

						doneReqs++

						if (allReqs == doneReqs)
							end(results)

					}
				})

			}

		  }

		})

	}
}
