
const { join } = require( "path" ),
      shell = require( "shelljs" ),
      fetch = require( "node-fetch" ),
      { dirname } = require( "path" ),
      { LocalStorage } = require( "node-localstorage" ),
      faker = require( "faker" ),
      localStorage = new LocalStorage( join( __dirname, "/../", "/storage" ) ),
      DIR_SCREENSHOTS_TRACE = ".trace";

let PATH_SCREENSHOTS = join( __dirname, "/../", "/screenshots"),
    PATH_COMPARE = join( __dirname, "/../", "/snapshots"),
    SUITE_NAME = "";

    /**
     * @see https://pptr.dev/#?product=Puppeteer&version=v1.5.0&show=api-class-page
     * @param {string} id
     * @param {string} screenshotTitle
     * @param {Object} [options]
     * @returns {Object}
     */
const png = ( id, screenshotTitle, options = {} ) => {
        const FILENAME_RE = /[^a-zA-Z\d\-\_]/g,
              normalizedTitle = screenshotTitle.replace( FILENAME_RE, "-" ),
              normalizedSuiteTitle = SUITE_NAME.replace( FILENAME_RE, "-" ),
              path = join( PATH_SCREENSHOTS, normalizedSuiteTitle, `${ id }.${ normalizedTitle }.png` );
        shell.mkdir( "-p" , dirname( path ) );
        return { path, ...options };
      },
      /**
       * @param {string} fileName
       * @returns {Object}
       */
      tracePng = ( fileName ) => {
        const path = join( PATH_SCREENSHOTS, DIR_SCREENSHOTS_TRACE, `${ fileName }.png` );
        shell.mkdir( "-p" , dirname( path ) );
        return { path };
      },
      /**
       * Create all of comparing dirs when non existing
       */
      initCompareDirs = () => {
        [ "expected", "actual", "diff" ].forEach(( stage ) => {
          shell.mkdir( "-p" , join( PATH_COMPARE, stage ) );
        });
      },
      /**
       * @param {string} stage
       * @param {string} testId
       * @returns {string}
       */
      getComparePath = ( stage, testId ) => join( PATH_COMPARE, stage, `${ testId }.png` ),


      /**
       * @param {number} max
       * @returns {number}
       */
      randomInt = ( max ) => Math.floor( Math.random() * Math.floor( max ) );

/**
 *
 * @param {string} path
 * @param {string} locale
 * @returns {string}
 */
function fake( path, locale ) {
  const [ ns, method ] = path.split( "." );
  faker.locale = locale;
  return faker[ ns ][ method ]();
}

/**
 * @typedef {object} PollParams
 * @property {string} url
 * @property {number} interval in ms
 * @property {number} timeout in ms
 * @property {function} parserFn
 * @param {object} [parserPayload] - extra payload for callback (e.g. email, timestamp)
 * @param {function} [requestFn] - optional function to replace the default one
 */
/**
 * poll given URL for value
 * @param {PollParams} params
 * @returns {Promise}
 */
function pollForValue({ url, interval, timeout, parserFn, parserPayload = {}, requestFn = null }) {

  const request = requestFn ? requestFn : async ( url ) => {
    const rsp = await fetch( url );
    if ( rsp.status < 200 || rsp.status >= 300  ) {
      return {};
    }
    return await rsp.json();
  };

  return new Promise(( resolve, reject ) => {
    const startTime = Date.now();
    pollForValue.attempts = 0;

    async function attempt() {
      if ( Date.now() - startTime > timeout ) {
        return reject( new Error( `Polling: Exceeded timeout of ${ timeout }ms` ) );
      }
      const value = parserFn( await request( url ), parserPayload );
      pollForValue.attempts ++;
      if ( !value ) {
        return setTimeout( attempt, interval );
      }
      resolve( value );
    }
    attempt();

  });
}



exports.fetch = fetch;

exports.localStorage = localStorage;

exports.util = {

  png,

  tracePng,

  getComparePath,

  initCompareDirs,

  setProjectDirectory: ( projectDirectory ) => {
    PATH_SCREENSHOTS = join( projectDirectory, "/screenshots");
    PATH_COMPARE = join( projectDirectory, "/snapshots");
  },

  setSuiteName: ( name ) => {
    SUITE_NAME = name;
  },

  pollForValue,

  exp: {
    fake,
    /**
     * @param {string[]} json
     * @returns {string}
     */
    random: ( json ) => json[ randomInt( json.length  ) ],
    /**
     * @param {string[]} json
     * @param {string} id
     * @returns {string}
     */
    iterate: ( json, id ) => {
      const sid = `iterate_${ id }`,
            inx = parseInt( localStorage.getItem( sid ) || 0, 10 );
      localStorage.setItem( sid, ( inx + 1 ) >= json.length ? 0 : inx + 1 );
      return `${ json[ inx ] }`;
    },
    /**
     * @param {string} id
     * @returns {string}
     */
    counter: ( id ) => {
       const sid = `counter_${ id }`,
            val = parseInt( localStorage.getItem( sid ) || 0, 10 ) + 1;
      localStorage.setItem( sid, val );
      return `${ val }`;
    }
  }

};

