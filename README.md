
SCPD Video Downloads
========

Usage
---

    scpd-curl

Dependencies
---

- Node v0.8+
- MPlayer ~v1.1
- Install this package using

        npm install -g scpd-curl

- If you are a developer, install other node deps using

        npm install

  in the `./scpd/` directory

Installation on a Mac
------

- If you haven't already, install XCode from the Mac App Store

    Once it's installed, go to `Preferences -> Downloads -> Components`,
    and install the `Command Line Tools`.

- Install Homebrew (http://mxcl.github.com/homebrew/)

    It's a manager for command line packages for OSX.
    There's a line from that site:

	    ruby -e "$(curl -fsSkL raw.github.com/mxcl/homebrew/go)"

    That you need to paste in your terminal window.

- Install MPlayer (http://www.mplayerhq.hu/)

	    brew install mplayer

    (might take a while)

- Install Node (http://nodejs.org/)

    Just get the pre-packaged binary.


- Install the package that I wrote

	    npm install -g scpd-curl

- Now, at your terminal window, you can just type:

	    scpd-curl

    And it'll give you a description of how to use the script.

- If you ever want to uninstall all of this

    In the terminal

        npm uninstall -g scpd-curl
        brew uninstall mplayer
    
    Figure out how to get rid of Node
    
    Homebrew [un-installation instructions](https://gist.github.com/1173223)

Webshop Reservations
======

To use, be smart

    python reserve.py

Dependencies
---

- Python 2.6+
- curl
