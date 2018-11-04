const codeMarkup = require( './codeMarkup.js' )
const sac = require( 'standardized-audio-context' )

let cm, cmconsole, exampleCode, 
    isStereo = false,
    environment = {}

const getPlainText = function( node ){
	// used for testing:
	//return node.innerText || node.textContent;

	var normalize = function(a){
		// clean up double line breaks and spaces
		if(!a) return "";
		return a.replace(/ +/g, " ")
				.replace(/[\t]+/gm, "")
				.replace(/[ ]+$/gm, "")
				.replace(/^[ ]+/gm, "")
				//.replace(/\n+/g, "\n")
				.replace(/\n+$/, "")
				.replace(/^\n+/, "")
				.replace(/\nNEWLINE\n/g, "\n\n")
				.replace(/NEWLINE\n/g, "\n\n"); // IE
	}
	var removeWhiteSpace = function(node){
		// getting rid of empty text nodes
		var isWhite = function(node) {
			return !(/[^\t\n\r ]/.test(node.nodeValue));
		}
		var ws = [];
		var findWhite = function(node){
			for(var i=0; i<node.childNodes.length;i++){
				var n = node.childNodes[i];
				if (n.nodeType==3 && isWhite(n)){
					ws.push(n)
				}else if(n.hasChildNodes()){
					findWhite(n);
				}
			}
		}
		findWhite(node);
		for(var i=0;i<ws.length;i++){
			ws[i].parentNode.removeChild(ws[i])
		}

	}
	var sty = function(n, prop){
		// Get the style of the node.
		// Assumptions are made here based on tagName.
		if(n.style[prop]) return n.style[prop];
		var s = n.currentStyle || n.ownerDocument.defaultView.getComputedStyle(n, null);
		if(n.tagName == "SCRIPT") return "none";
		if(!s[prop]) return "LI,P,TR".indexOf(n.tagName) > -1 ? "block" : n.style[prop];
		if(s[prop] =="block" && n.tagName=="TD") return "feaux-inline";
		return s[prop];
	}

	var blockTypeNodes = "table-row,block,list-item";
	var isBlock = function(n){
		// diaply:block or something else
		var s = sty(n, "display") || "feaux-inline";
		if(blockTypeNodes.indexOf(s) > -1) return true;
		return false;
	}
	var recurse = function(n){
		// Loop through all the child nodes
		// and collect the text, noting whether
		// spaces or line breaks are needed.
		if(/pre/.test(sty(n, "whiteSpace"))) {
			t += n.innerHTML
				.replace(/\t/g, " ")
				.replace(/\n/g, " "); // to match IE
			return "";
		}
		var s = sty(n, "display");
		if(s == "none") return "";
		var gap = isBlock(n) ? "\n" : " ";
		t += gap;
		for(var i=0; i<n.childNodes.length;i++){
			var c = n.childNodes[i];
			if(c.nodeType == 3) t += c.nodeValue;
			if(c.childNodes.length) recurse(c);
		}
		t += gap;
		return t;
	}
	// Use a copy because stuff gets changed
	node = node.cloneNode(true);
	// Line breaks aren't picked up by textContent
	node.innerHTML = node.innerHTML.replace(/<br>/g, "\n");

	// Double line breaks after P tags are desired, but would get
	// stripped by the final RegExp. Using placeholder text.
	var paras = node.getElementsByTagName("p");
	for(var i=0; i<paras.length;i++){
		paras[i].innerHTML += "NEWLINE";
	}

	var t = "";
	removeWhiteSpace(node);
	// Make the call!
	return normalize(recurse(node));
}

const createEditor = function( selector, shouldAnnotate = true ) {
  const container = document.querySelector( selector )
  
  const editor = document.querySelector( selector + ' .editor' ) 
  const code = getPlainText( editor ) 
  editor.innerText = ''

  const cm = CodeMirror( document.querySelector( selector + ' .editor' ), {
    mode:   'javascript',
    value:  code, 
    keyMap: 'playground',
    autofocus: false,
    matchBrackets:true,
    indentUnit:2,
    autoCloseBrackets:true,
    tabSize:2,
  })

  cm.setSize( null, '100%' )

  const play = document.createElement('button')
  play.innerText = 'play'
  play.classList.add( 'float-right' )
  play.onclick = ()=> {
    if( Gibber.initialized === true ) {
      playCode( cm, shouldAnnotate )
    }else{
      setTimeout( ()=> playCode( cm, shouldAnnotate ), 250 )
    }

    return true
  }

  const stop = document.createElement( 'button' )
  stop.classList.add( 'float-right' )
  stop.innerText = 'stop'
  stop.onclick = function() {
    Gibber.clear()
    for( let key of environment.proxies ) delete window[ key ]
    environment.proxies.length = 0
  }

  container.appendChild( stop )
  container.appendChild( play )
}

const playCode = function( cm, shouldAnnotate=true ) {
  cm.execCommand( 'selectAll' )
  CodeMirror.keyMap.playground[ 'Ctrl-Enter' ]( cm,shouldAnnotate ) 
  //cm.execCommand( 'undoSelection' )
}

window.onload = function() {
  window.sac = sac
  const workletPath = 'gibberish_worklet.js' 
  Gibber.init( workletPath, new sac.AudioContext() )

  environment.editor = cm
  window.Environment = environment
  environment.annotations = true

  // XXX this should not be in 'debug' mode...
  environment.debug = true
  environment.codeMarkup = codeMarkup( Gibber )
  environment.codeMarkup.init()

  environment.displayCallbackUpdates = function() {
    Gibberish.oncallback = function( cb ) {
      environment.console.setValue( cb.toString() )
    }
  }

  environment.Annotations = environment.codeMarkup 
  Gibber.Environment = environment

  let select = document.querySelector( 'select' ),
    files = [
    ]

  createEditor( '#static1' )
  createEditor( '#array1' )
  createEditor( '#array2' )
  createEditor( '#transform1' )
  createEditor( '#transform2', false )
  createEditor( '#anonymous1' )
  createEditor( '#anonymous2' )
  createEditor( '#euclid' )
  createEditor( '#euclid2' )
  createEditor( '#full' )
  createEditor( '#sparklines1' )
  createEditor( '#sparklines2' )
  createEditor( '#fade' )

}

let shouldUseProxies = false
environment.proxies = []

const createProxies = function( pre, post, proxiedObj ) {
  const newProps = post.filter( prop => pre.indexOf( prop ) === -1 )

  for( let prop of newProps ) {
    let ugen = proxiedObj[ prop ]

    Object.defineProperty( proxiedObj, prop, {
      get() { return ugen },
      set(value) {

        const member = ugen
        if( member !== undefined && value !== undefined) {

          if( typeof member === 'object' && member.__wrapped__ !== undefined ) {
            if( member.__wrapped__.connected !== undefined ) {
              // save copy of connections
              const connected = member.__wrapped__.connected.slice( 0 )
              if( member.disconnect !== undefined ) {
                for( let connection of connected ) {
                  // 0 index is connection target

                  if( connection[0].isProperty === true ) {
                    // if it's a modulation
                    let idx = connection[0].mods.indexOf( ugen )

                    connection[0].mods.splice( idx, 1 )
                  }else{
                    member.disconnect( connection[ 0 ] )
                  }

                  let shouldConnect = true
                  if( connection[0] !== Gibber.Gibberish.output || Gibber.autoConnect === false ) {
                    if( connection[0].isProperty !== true ) {
                      shouldConnect = false
                    }
                    // don't connect new ugen to old ugen's effects chain... new
                    // ugen should have its own chain.
                    if( member.fx.indexOf( connection[0] ) > -1 ) {
                      shouldConnect = false
                    }
                  }

                  if( shouldConnect === true ) {
                    value.connect( connection[ 0 ] )
                  } 
                }
              }
              // check for effects input to copy.
              // XXX should we do this for busses with connected ugens as well???
              // right now we are only connecting new ugens to busses... should we
              // also connect new busses to their prior inputs if proxied?
              if( member.input !== undefined ) {
                value.input = member.input
              }
            }

            // XXX this is supposed to loop through the effecfs of the old ugen, compare them to the fx
            // in the new ugen, and then connect to any destination busses. unfortunately it seems buggy,
            // and I don't feel like fixing at the moment. This means that you have to reconnect effects
            // to busses that aren't the master (or the next effect in an effect chain).

            /*
            if( member.fx !== undefined && member.fx.length > 0 && value.fx !== undefined && value.fx.length > 0 ) {
              for( let i = 0; i < member.fx.length; i++ ) {
                const newEffect = value.fx[ i ]
                if( newEffect !== undefined ) {
                  const oldEffect = member.fx[ i ]

                  for( let j = 0; j < oldEffect.__wrapped__.connected.length; j++ ) {
                    let connection = oldEffect.__wrapped__.connected[ j ][ 0 ]
                    
                    // check to make sure connection is not simply in fx chain...
                    // if it is, it is probably recreatd in as part of a preset, so
                    // don't redo it here.
                    if( member.fx.indexOf( connection ) === -1 ) {
                      newEffect.connect( connection, oldEffect.__wrapped__.connected[ j ][ 1 ] )  
                    }
                  }
                }
              }
            }*/

            // make sure to disconnect any fx in the old ugen's fx chain
            member.fx.forEach( effect => { 
              effect.disconnect()
              effect.clear() 
            })
            member.fx.length = 0
          }
        }

        if( ugen.clear !== undefined ) {
          ugen.clear()
        }else if( ugen.__onclear !== undefined ) {
          // XXX does this condition ever happen?
          ugen.__onclear()     
        }

        ugen = value
      }
    })

    environment.proxies.push( prop )
  }
}

CodeMirror.keyMap.playground =  {
  fallthrough:'default',

  'Ctrl-Enter': function( cm, shouldAnnotate = true ) {
    const selectedCode = getSelectionCodeColumn( cm, false )

    flash( cm, selectedCode.selection )

    const func = new Function( selectedCode.code )

    Gibber.shouldDelay = true 

    const preWindowMembers = Object.keys( window )
    func()
    const postWindowMembers = Object.keys( window )

    if( preWindowMembers.length !== postWindowMembers.length ) {
      createProxies( preWindowMembers, postWindowMembers, window )
    }

    if( shouldAnnotate === true ) {
      try {
        const markupFunction = () => {
          cm.execCommand( 'undoSelection' )
          Environment.codeMarkup.process( 
            selectedCode.code, 
            selectedCode.selection, 
            cm, 
            Gibber.currentTrack 
          ) 
        }

        markupFunction.origin = func

        if( !Environment.debug ) {
          Gibber.Scheduler.functionsToExecute.push( func )
          if( Environment.annotations === true ) {
            Gibber.Scheduler.functionsToExecute.push( markupFunction  )
          }
        }else{
          //func()
          if( Environment.annotations === true ) markupFunction()
        }
      } catch (e) {
        console.log( e )
        return
      }
    }
    
    Gibber.shouldDelay = false
  },
  'Alt-Enter'( cm ) {
    try {
      var selectedCode = getSelectionCodeColumn( cm, true )

      flash( cm, selectedCode.selection )

      var func = new Function( selectedCode.code )

      Gibber.shouldDelay = true
      const preWindowMembers = Object.keys( window )
      func()
      const postWindowMembers = Object.keys( window )

      if( preWindowMembers.length !== postWindowMembers.length ) {
        createProxies( preWindowMembers, postWindowMembers, window )
      }

      //const func = new Function( selectedCode.code ).bind( Gibber.currentTrack ),
      const markupFunction = () => {
              Environment.codeMarkup.process( 
                selectedCode.code, 
                selectedCode.selection, 
                cm, 
                Gibber.currentTrack 
              ) 
            }

      markupFunction.origin = func

      if( !Environment.debug ) {
        Gibber.Scheduler.functionsToExecute.push( func )
        if( Environment.annotations === true ) {
          Gibber.Scheduler.functionsToExecute.push( markupFunction  )
        }
      }else{
        //func()
        if( Environment.annotations === true ) markupFunction()
      }

    } catch (e) {
      console.log( e )
      return
    }

    Gibber.shouldDelay = false
  },
  'Ctrl-.'( cm ) {
    Gibber.clear()
    //if( dat !== undefined ) {
    //  dat.GUI.__all__.forEach( v => v.destroy() )
    //  dat.GUI.__all__.length = 0
    //}
    for( let key of environment.proxies ) delete window[ key ]
    environment.proxies.length = 0
    //Gibberish.generateCallback()
    //cmconsole.setValue( fixCallback( Gibberish.callback.toString() ) )
  },
  //'Shift-Ctrl-C'(cm) { toggleSidebar() }
}

//const toggleSidebar = () => {
//    Environment.sidebar.isVisible = !Environment.sidebar.isVisible
//    let editor = document.querySelector( '#editor' )
//    if( !Environment.sidebar.isVisible ) {
//      Environment.editorWidth = editor.style.width
//      editor.style.width = '100%'
//    }else{
//      editor.style.width = Environment.editorWidth
//    }

//    Environment.sidebar.style.display = Environment.sidebar.isVisible ? 'block' : 'none'
//}
var getSelectionCodeColumn = function( cm, findBlock ) {
  var pos = cm.getCursor(), 
  text = null

  if( !findBlock ) {
    text = cm.getDoc().getSelection()

    if ( text === "") {
      text = cm.getLine( pos.line )
    }else{
      pos = { start: cm.getCursor('start'), end: cm.getCursor('end') }
      //pos = null
    }
  }else{
    var startline = pos.line, 
    endline = pos.line,
    pos1, pos2, sel

    while ( startline > 0 && cm.getLine( startline ) !== "" ) { startline-- }
    while ( endline < cm.lineCount() && cm.getLine( endline ) !== "" ) { endline++ }

    pos1 = { line: startline, ch: 0 }
    pos2 = { line: endline, ch: 0 }

    text = cm.getRange( pos1, pos2 )

    pos = { start: pos1, end: pos2 }
  }

  if( pos.start === undefined ) {
    var lineNumber = pos.line,
    start = 0,
    end = text.length

    pos = { start:{ line:lineNumber, ch:start }, end:{ line:lineNumber, ch: end } }
  }

  return { selection: pos, code: text }
}

var flash = function(cm, pos) {
  var sel,
  cb = function() { sel.clear() }

  if (pos !== null) {
    if( pos.start ) { // if called from a findBlock keymap
      sel = cm.markText( pos.start, pos.end, { className:"CodeMirror-highlight" } );
    }else{ // called with single line
      sel = cm.markText( { line: pos.line, ch:0 }, { line: pos.line, ch:null }, { className: "CodeMirror-highlight" } )
    }
  }else{ // called with selected block
    sel = cm.markText( cm.getCursor(true), cm.getCursor(false), { className: "CodeMirror-highlight" } );
  }

  window.setTimeout(cb, 250);
}
