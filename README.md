# BeenThere React app

First, configure the run mode

    cd src
    cp example.settings.js settings.js
    # Edit settings.js
    # Load the map key, optional set DEV_MODE = true

Installation

    npm install

    # Sometimes this requires legacy peer deps
    npm install --legacy-peer-deps

Build the code

    npm run build
    sudo chown -R www-data:www-data build
    sudo systemctl restart apache2

Optional Dev Public

sudo pacman -S mkcert
mkcert -install
mkdir reactcert
mkcert -key-file ./reactcert/key.pem -cert-file ./reactcert/cert.pem "localhost"

"start-ssl": "HTTPS=true SSL_CRT_FILE=./reactcert/cert.pem SSL_KEY_FILE=./reactcert/key.pem react-scripts start"

Allow hosts

    vi node_modules/react-scripts/config/webpackDevServer.config.js
    # Change allowedHosts
    allowedHosts: ['XXXX']


HOST=XXX npm run start-ssl

# Scripts

create_release_bundle.sh - Builds a tar/gz of the react app, ready to drop into django

# Code Structure

### Src

**index.js** - Main entry of the app. Base routing happens inside this render. The user's information is queried and loaded into the global state.

**store.js** - The global data store. This should be used as rarely as possible to provide context to the program. This is not a central method for exchanging app messages.

**pages/** - React pages that are ***not*** inherited by other pages / components. The base level pages provide base layout and routing to the specific pages. admin and user folders are for specific portal pages.

**components/** - React components that ***are*** inherited by other pages / components. The base level provides shared components. admin and user folders are components that are specific to the portals.

**helpers/** - Javascript helper functions. util.js provides API access to the app.


### Public

Static content for the app.
