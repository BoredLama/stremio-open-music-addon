# Stremio Open Music Add-on

Search for music streams on Open Directories from Google searches.

**This Add-on requires Stremio v4.4.10+**

Note 1: After running the Stremio Open Directories Add-on for the first time, a `config.json` file will be created in the same folder as the add-on executable. You can edit this file to configure the add-on.

Note 2: Alternatively, you can also use command line arguments to configure the add-on. Use `--google-results=25` to set the number of Google results to parse, default is `25`.

Note 3: If you overuse this add-on and make a lot of requests fast, Google can block the add-on from making further requests. This block can last for a few hours but can be bypassed if you go on Google from your browser and solve the captcha.

Note 4: Run the add-on with `--remote` (or set `remote` to `true` in `config.json`) to also receive an add-on url that will work through LAN and the Internet (instead of just locally).

Note 5: Setting `autoLaunch` to `true` in `config.json` will make the add-on auto launch on system start-up.


## Usage


### Run Open Directories Add-on

[Download Open Music Add-on](https://github.com/BoredLama/stremio-open-music-addon/releases) for your operating system, unpack it, run it.


### Add Open Directories Add-on to Stremio

Add `http://127.0.0.1:7010/manifest.json` as an Add-on Repository URL in Stremio.

After enabling the add-on, simply search for an artist and/or a song name in Stremio click the result from this add-on and then the stream you wish to listen to.

Searching is case-sensitive, so make sure you write the artist and/or song name correctly.

![addlink](https://user-images.githubusercontent.com/1777923/43146711-65a33ccc-8f6a-11e8-978e-4c69640e63e3.png)
