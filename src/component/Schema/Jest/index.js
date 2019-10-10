import { RUNNER_PUPPETRY, SELECTOR_CHAIN_DELIMITER, SELECTOR_CSS } from "constant";
import { validateSimpleSelector } from "service/selector";
import { result } from "service/utils";
import { renderSuiteHtml } from "./interactive-mode";
import { TestGeneratorError } from "error";
import fs from "fs";
import { join } from "path";

const NETWORK_TIMEOUT = 50000,
      INTERACTIVE_MODE_TIMEOUT = 1800000, // 30min

      normalizeName = ( str ) => {
        const re = /[^a-zA-Z0-9_-]/g;
        return str.replace( re, "--" );
      },

      readInteractAsset = ( outputDirectory, file ) => fs.readFileSync(
        join( outputDirectory, "lib", "interactive-mode", file ), "utf8"
      );

export function buildShadowDomQuery( targetChain ) {
  const code = targetChain.reduce(( carry, target, inx ) => {
    if ( !target.css ) {
      throw new TestGeneratorError( `Shadow DOM queries currently support only CSS selectors` );
    }
    if ( inx === 0 ) {
      return `document.querySelector( "${ target.selector }" )`;
    }
    return `${ carry }.shadowRoot.querySelector( "${ target.selector }" )`;
  }, "" );
  return `await bs.page.evaluateHandle('${ code }')`;
}

export const tplQuery = ( targetChain ) => {
    const target = targetChain[ targetChain.length - 1 ],
          str = JSON.stringify.bind( JSON );

    let fnBody = ( target.parentType === "shadowHost"
      ? buildShadowDomQuery( targetChain )
      : ( targetChain.length === 1
        ? `await bs.query( ${ str( target.selector ) }, ${ str( target.css ) }, ${ str( target.target ) } )`
        : `await bs.queryChain( ${ str( targetChain )}, ${ str( target ) } )` )
    );

    return `targets[ "${ target.target }" ] = async () => ${ fnBody };`;

};

function buildEnv( env ) {
  if ( !env || !env.variables ) {
    return "";
  }
  const body = Object.entries( env.variables )
    .map( ([ k, v ]) => `  "${ k }": "${ v }"` )
    .join( ",\n" );
  return `// Environment variables
const ENV = {
${ body }
};`;
}

function getSetupOptions( options ) {
  return JSON.stringify({
    incognito: result( options, "incognito", false ),
    ignoreHTTPSErrors: result( options, "ignoreHTTPSErrors", false ),
    headless: result( options, "headless", true ),
    launcherArgs: result( options, "launcherArgs", "" ),
    devtools: result( options, "devtools", false )
  });
}

export const tplSuite = ({
  title, body, targets, suite, runner, projectDirectory, outputDirectory, env, options, interactive
}) => `
/**
 * Generated by https://github.com/dsheiko/puppetry
 * on ${ String( Date() ) }
 * Suite: ${ suite.title }
 */

${ runner !== RUNNER_PUPPETRY ? `var nVer = process.version.match( /^v(\\d+)/ );
if ( !nVer || nVer[ 1 ] < 9 ) {
  console.error( "WARNING: You have an outdated Node.js version " + process.version
    + ". You need at least v.9.x to run this test suite." );
}
` : `` }

const {
        bs, util, fetch, localStorage
      } = require( "../lib/bootstrap" )( ${ JSON.stringify( normalizeName( title ) ) } ),
      devices = require( "puppeteer/DeviceDescriptors" );

${ runner === RUNNER_PUPPETRY ? `
util.setProjectDirectory( ${ JSON.stringify( projectDirectory ) } );
` : `` }

jest.setTimeout( ${  result( options, "jestTimeout", 0 )
  ? options.jestTimeout
  : ( options.interactiveMode
    ? INTERACTIVE_MODE_TIMEOUT
    : ( suite.timeout || NETWORK_TIMEOUT ) )
} );

const targets = {},
      consoleLog = [], // assetConsoleMessage
      dialogLog = []; // assertDialog;

${ buildEnv( env ) }

${ targets }

describe( ${ JSON.stringify( title ) }, async () => {
  beforeAll(async () => {
    await bs.setup(${ getSetupOptions( options ) });

    bs.page.on( "console", ( msg ) => consoleLog.push( msg ) );
    bs.page.on( "dialog", ( dialog ) => dialogLog.push( dialog.message() ) );

    ${ options.requireInterceptTraffic ? `bs.performance.watchTraffic();` : `` }

    ${ options.interactiveMode ? `
    let stepIndex = 0;
    await bs.page.exposeFunction('setPuppetryStepIndex', index => {
      stepIndex = index;
    });

    bs.page.on( "load", async () => {
      await bs.page.addStyleTag({ content: \`${ readInteractAsset( outputDirectory, "toolbox.css" ) }\`});
      await bs.page.addScriptTag({ content: \`
        const data = ${ JSON.stringify( interactive )  };
        let stepIndex = \${ stepIndex };
        const suiteHtml = ${ JSON.stringify( renderSuiteHtml( suite ) ) };
        ${ readInteractAsset( outputDirectory, "toolbox.js" ) }\`});
    });
    ` : `` }
  });

  afterAll(async () => {
    await bs.teardown();
  });

${body}

});
`;

export const tplGroup = ({ title, body }) => `
  describe( ${ JSON.stringify( title ) }, async () => {
${body}
  });
`;

export const tplTest = ({ title, body }) => `
    test( ${ JSON.stringify( title ) }, async () => {
      let result, assert;
${body}
    });
`;