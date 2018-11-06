(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = function( Marker ) {
  'use strict'

  const ArrayExpression = function( patternNode, state, seq, patternType, container=null, index=0, isLookup=false ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const target = seq.target // XXX in gibberwocky this was seq.object
    const patternObject = seq[ patternType ]
    const [ patternName, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = patternName 

    patternObject.markers = []
    patternObject.node = patternNode 

    if( target.markup === undefined ) Marker.prepareObject( target )

    // create marker for entire array...
    const arrayMarker = cm.markText( start, end, { className:cssName })
    target.markup.textMarkers[ cssName ] = arrayMarker

    // then create markers for individual elements
    let count = 0
    for( let element of patternNode.elements ) {
      let cssClassName = patternName + '_' + count,
          elementStart = Object.assign( {}, start ),
          elementEnd   = Object.assign( {}, end   ),
          marker
      
      elementStart.ch = element.loc.start.column// + Marker.offset.horizontal
      elementEnd.ch   = element.loc.end.column //  + Marker.offset.horizontal

      if( element.type === 'BinaryExpression' ) {
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
           startStyle: 'annotation-no-right-border',
           endStyle: 'annotation-no-left-border',
           //inclusiveLeft:true, inclusiveRight:true
        })

        // create specific border for operator: top, bottom, no sides
        const divStart = Object.assign( {}, elementStart )
        const divEnd   = Object.assign( {}, elementEnd )

        divStart.ch += 1
        divEnd.ch -= 1

        const marker2 = cm.markText( divStart, divEnd, { className:cssClassName + '_binop annotation-binop' })

        patternObject.markers.push( marker, marker2 )

      }else if (element.type === 'UnaryExpression' ) {
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation', 
          //inclusiveLeft: true,
          //inclusiveRight: true
        })

        let start2 = Object.assign( {}, elementStart )
        start2.ch += 1
        let marker2 = cm.markText( elementStart, start2, { 
          'className': cssClassName + ' annotation-no-right-border', 
          //inclusiveLeft: true,
          //inclusiveRight: true
        })

        let marker3 = cm.markText( start2, elementEnd, { 
          'className': cssClassName + ' annotation-no-left-border', 
          //inclusiveLeft: true,
          //inclusiveRight: true
        })

        patternObject.markers.push( marker, marker2, marker3 )
      }else if( element.type === 'ArrayExpression' ) {
         marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
          //inclusiveLeft:true, inclusiveRight:true,
          startStyle:'annotation-left-border-start',
          endStyle: 'annotation-right-border-end',
         })


         // mark opening array bracket
         const arrayStart_start = Object.assign( {}, elementStart )
         const arrayStart_end  = Object.assign( {}, elementStart )
         arrayStart_end.ch += 1
         cm.markText( arrayStart_start, arrayStart_end, { className:cssClassName + '_start' })

         // mark closing array bracket
         const arrayEnd_start = Object.assign( {}, elementEnd )
         const arrayEnd_end   = Object.assign( {}, elementEnd )
         arrayEnd_start.ch -=1
         const marker2 = cm.markText( arrayEnd_start, arrayEnd_end, { className:cssClassName + '_end' })

         patternObject.markers.push( marker, marker2 )

      }else{
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
          //inclusiveLeft:true, inclusiveRight:true
        })

        patternObject.markers.push( marker )
      }

      if( target.markup.textMarkers[ patternName  ] === undefined ) target.markup.textMarkers[ patternName ] = []
      target.markup.textMarkers[ patternName ][ count ] = marker
     
      if( target.markup.cssClasses[ patternName ] === undefined ) target.markup.cssClasses[ patternName ] = []
      target.markup.cssClasses[ patternName ][ count ] = cssClassName 
      
      count++
    }
    
    let highlighted = { className:null, isArray:false },
        cycle = Marker._createBorderCycleFunction( patternName, patternObject )
    
    patternObject.patternType = patternType 
    patternObject.patternName = patternName

    patternObject.update = () => {
      let className = '.' + patternName
      
      className += '_' + patternObject.update.currentIndex 

      if( highlighted.className !== className ) {

        // remove any previous annotations for this pattern
        if( highlighted.className !== null ) {
          if( highlighted.isArray === false && highlighted.className ) { 
            $( highlighted.className ).remove( 'annotation-border' ) 
          }else{
            $( highlighted.className ).remove( 'annotation-array' )
            $( highlighted.className + '_start' ).remove( 'annotation-border-left' )
            $( highlighted.className + '_end' ).remove( 'annotation-border-right' )

            if( $( highlighted.className + '_binop' ).length > 0 ) {
              $( highlighted.className + '_binop' ).remove( 'annotation-binop-border' )
            }

          }
        }

        // add annotation for current pattern element
        const values = isLookup === false ? patternObject.values : patternObject._values

        if( Array.isArray( values[ patternObject.update.currentIndex ] ) ) {
          $( className ).add( 'annotation-array' )
          $( className + '_start' ).add( 'annotation-border-left' )
          $( className + '_end' ).add( 'annotation-border-right' )
          highlighted.isArray = true
        }else{
          $( className ).add( 'annotation-border' )

          if( $( className + '_binop' ).length > 0 ) {
            $( className + '_binop' ).add( 'annotation-binop-border' )
          }
          highlighted.isArray = false
        }

        highlighted.className = className

        cycle.clear()
      }else{
        cycle( Array.isArray( patternObject.value ) )
      }
    }

    let currentIndex = 0
    Object.defineProperty( patternObject.update, 'currentIndex', {
      get() { return currentIndex },
      set(v){ 
        currentIndex = v; 
        patternObject.update( true )
      }
    })

    // check to see if a clear function already exists and save reference
    // XXX should clear be saved somewhere else... on the update function?
    let __clear = null
    if( patternObject.clear !== undefined )  __clear = patternObject.clear

    patternObject.clear = () => {
      if( highlighted.className !== null ) { $( highlighted.className ).remove( 'annotation-border' ) }
      cycle.clear()
      patternObject.markers.forEach( marker => marker.clear() )
      if( __clear !== null ) __clear()
    }

    Marker._addPatternFilter( patternObject )
    patternObject._onchange = () => { Marker._updatePatternContents( patternObject, patternName, target ) }
  }
    
  return ArrayExpression
}


},{"./../../utility.js":48}],2:[function(require,module,exports){
module.exports = function( Marker ) {
  'use strict'

  // 1/4, 1/8 etc.
  const BinaryExpression = function( patternNode, state, seq, patternType,container=null, index=0 ) {
    if( patternNode.processed === true ) return 
    const cm = state.cm
    const seqTarget = seq.target //XXX in gibberwocky this was seq.object
    const patternObject = seq[ patternType ]
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = className

    const marker = cm.markText(
      start, 
      end,
      { 
        'className': cssName + ' annotation annotation-border' ,
        startStyle: 'annotation-no-right-border',
        endStyle: 'annotation-no-left-border',
        //inclusiveLeft:true,
        //inclusiveRight:true
      }
    )

    if( seqTarget.markup === undefined ) Marker.prepareObject( seqTarget )
    seqTarget.markup.textMarkers[ className ] = marker

    const divStart = Object.assign( {}, start )
    const divEnd   = Object.assign( {}, end )

    divStart.ch += 1
    divEnd.ch -= 1

    const marker2 = cm.markText( divStart, divEnd, { className:'annotation-binop-border' })     

    if( seqTarget.markup.cssClasses[ className ] === undefined ) seqTarget.markup.cssClasses[ className ] = []
    seqTarget.markup.cssClasses[ className ][ index ] = cssName

    patternObject.marker = marker

    Marker.finalizePatternAnnotation( patternObject, className, seqTarget, marker )
  }

  return BinaryExpression 

}

},{}],3:[function(require,module,exports){
module.exports = function( Marker ) {
  'use strict'

  // CallExpression denotes an array (or other object) that calls a method, like .rnd()
  // could also represent an anonymous function call, like Rndi(19,40)
  const CallExpression = function( patternNode, state, seq, patternType, index=0 ) {
    if( patternNode.processed === true ) return 

    var args = Array.prototype.slice.call( arguments, 0 )

    if( patternNode.callee.type === 'MemberExpression' && patternNode.callee.object.type === 'ArrayExpression' ) {
      args[ 0 ] = patternNode.callee.object
      args[ 0 ].offset = Marker.offset

      Marker.patternMarkupFunctions.ArrayExpression( ...args )
    } else if (patternNode.callee.type === 'Identifier' ) {
      // function like Euclid or gen~
      Marker.patternMarkupFunctions.Identifier( ...args )
    }
  }

  return CallExpression
}

},{}],4:[function(require,module,exports){
const __Identifier = function( Marker ) {

  const mark = function( node, state, patternType, seqNumber ) {
    const [ className, start, end ] = Marker._getNamesAndPosition( node, state, patternType, seqNumber )
    const cssName = className + '_' + seqNumber
    const commentStart = end

    // we define the comment range as being one character, this
    // only defines the range of characters that will be replaced
    // by the eventual longer comment string.
    const commentEnd = Object.assign( {}, commentStart )
    commentEnd.ch += 1

    const line = end.line
    const lineTxt = state.cm.getLine( line )
    let ch = end.ch

    // for whatever reason, sometimes the ch value leads to
    // an undefined final character in the string. In that case,
    // work back until we find the actual final character.
    let lastChar = lineTxt[ ch ]
    while( lastChar === undefined ) {
      ch--
      lastChar = lineTxt[ ch ]
    }
    
    // different replacements are used for use in sequencers, when a callexpression
    // creating a wavepattern is often followed by a comma, vs when a wavepattern is
    // assigned to a variable, when no comma is present
    if( lastChar === ',' ) {
      state.cm.replaceRange( ' ,', { line, ch:ch }, { line, ch:ch + 1 } ) 
    }else if( lastChar === ')' ){
      state.cm.replaceRange( ') ', { line, ch:ch }, { line, ch:ch + 1 } )
    }else{
      state.cm.replaceRange( lastChar + ' ', { line, ch:ch }, { line, ch:ch + 1 } )
    }
    
    const marker = state.cm.markText( commentStart, commentEnd, { className })

    return [ marker, className ]
  }

  // Typically this is used with named functions. For example, if you store an
  // Arp in the variable 'a' and pass 'a' into a sequence, 'a' is the Identifier
  // and this function will be called to mark up the associated pattern.
  const Identifier = function( patternNode, state, seq, patternType, containerNode, seqNumber ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const track = seq.target//object
    const patternObject = seq[ patternType ]
    const [ marker, className ] = mark( patternNode, state, patternType, seqNumber )

    // WavePatterns can also be passed as named functions; make sure we forward
    // these to the appropriate markup functions
    if( patternObject.type === 'WavePattern' || patternObject.isGen ) { //|| patternObject.type === 'Lookup' ) {

      if( patternObject.widget === undefined ) { // if wavepattern is inlined to .seq 
        Marker.processGen( containerNode, cm, track, patternObject, seq )
      }else{
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track, Marker )
      }
    }else{
      let updateName = typeof patternNode.callee !== 'undefined' ? patternNode.callee.name : patternNode.name
      
      // this doesn't work for variables storing lookups, as there's no array to highlight
      // if( patternObject.type === 'Lookup' ) updateName = 'Lookup' 

      if( Marker.patternUpdates[ updateName ] ) {
        if( updateName !== 'Lookup' ) {
          patternObject.update =  Marker.patternUpdates[ updateName ]( patternObject, marker, className, cm, track, patternNode, Marker )
        }else{
          Marker.patternUpdates[ updateName ]( patternObject, marker, className, cm, track, patternNode, patternType, seqNumber, Marker )
        }
      } else {
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track, Marker )
      }
      
      patternObject.patternName = className

      // store value changes in array and then pop them every time the annotation is updated
      patternObject.update.value = []

      //if( updateName !== 'Lookup' )
        //Marker._addPatternFilter( patternObject )
    }

    if( patternObject.update !== undefined ) {
      let currentIndex = 0
      Object.defineProperty( patternObject.update, 'currentIndex', {
        get() { return currentIndex },
        set(v){ 
          if( currentIndex !== v ) {
            currentIndex = v; 
            patternObject.update()
          }
        }
      })

      // XXX why was this commented out? without it, annotations for anonymous functions
      // don't work.
      let value = 0
      Object.defineProperty( patternObject.update, 'value', {
        get() { return value },
        set(v){ 
          if( value !== v ) {
            value = v; 
            patternObject.update()
          }
        }
      })
    }

    patternObject.marker = marker
  }


  return Identifier
}

module.exports = __Identifier

},{}],5:[function(require,module,exports){
module.exports = function( Marker ) {
  // Marker.patternMarkupFunctions[ valuesNode.type ]( valuesNode, state, seq, 'values', container, seqNumber )

  const Literal = function( patternNode, state, seq, patternType, container=null, index=0 ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const seqTarget = seq.target // XXX seq.object for gibberwocky
    const patternObject = seq[ patternType ]

    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = className

    const marker = cm.markText( start, end, { 
      'className': cssName + ' annotation-border', 
      //inclusiveLeft: true,
      //inclusiveRight: true
    })

    if( seqTarget.markup === undefined ) Marker.prepareObject( seqTarget )

    seqTarget.markup.textMarkers[ className ] = marker

    if( seqTarget.markup.cssClasses[ className ] === undefined ) seqTarget.markup.cssClasses[ className ] = []

    seqTarget.markup.cssClasses[ className ][ index ] = cssName    
    
    patternObject.marker = marker
    Marker.finalizePatternAnnotation( patternObject, className, seqTarget, marker )
  }

  return Literal 

}

},{}],6:[function(require,module,exports){
module.exports = function( Marker ) {
  
  // for negative literals e.g. -10
  const UnaryExpression = function( patternNode, state, seq, patternType, container=null, index=0 ) {
    if( patternNode.processed === true ) return 
    const cm = state.cm
    const seqTarget = seq.target
    const patternObject = seq[ patternType ]
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = className

    marker = cm.markText( start, end, { 
      'className': cssName + ' annotation', 
      //inclusiveLeft: true,
      //inclusiveRight: true
    })

    if( seqTarget.markup === undefined ) Marker.prepareObject( seqTarget )
    seqTarget.markup.textMarkers[ className ] = marker

    if( seqTarget.markup.cssClasses[ className ] === undefined ) seqTarget.markup.cssClasses[ className ] = []

    seqTarget.markup.cssClasses[ className ][ index ] = cssName    

    let start2 = Object.assign( {}, start )
    start2.ch += 1
    let marker2 = cm.markText( start, start2, { 
      'className': cssName + ' annotation-no-right-border', 
      //inclusiveLeft: true,
      //inclusiveRight: true
    })

    let marker3 = cm.markText( start2, end, { 
      'className': cssName + ' annotation-no-left-border', 
      //inclusiveLeft: true,
      //inclusiveRight: true
    })


    patternObject.marker = marker
    Marker.finalizePatternAnnotation( patternObject, className )
  }

  return UnaryExpression

}

},{}],7:[function(require,module,exports){
const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = function( node, cm, track, objectName, state, cb ) {
  const Marker = Environment.codeMarkup // tsk tsk tsk global...
  const patternObject = window[ objectName ].seq.values

  // the location of the node containing the drums sequence depends on whether
  // or not a call to .connect() is added to the Drums constructor. 
  const drumsStringNode = node.callee.object !== undefined ? node.callee.object.arguments[0] : node.arguments[0]

  track.markup.textMarkers[ 'pattern' ] = []
  track.markup.textMarkers[ 'pattern' ].children = []

  let nodePosStart = Object.assign( {}, drumsStringNode.loc.start ),
      nodePosEnd   = Object.assign( {}, drumsStringNode.loc.end )

  nodePosStart.line += Marker.offset.vertical - 1 
  nodePosStart.ch = nodePosStart.column + 1
  nodePosEnd.line += Marker.offset.vertical - 1
  nodePosEnd.ch = nodePosEnd.column - 1

  track.markup.textMarkers.string = cm.markText( nodePosStart, nodePosEnd, { className:'euclid' })

  let marker
  const mark = function() {
    let startPos = track.markup.textMarkers.string.find()//{ loc:{ start:{}, end:{}} }
    for( let i = 0; i < drumsStringNode.value.length; i++ ) {
      let pos = { loc:{ start:{}, end:{}} }
      Object.assign( pos.loc.start, startPos.from )
      Object.assign( pos.loc.end  , startPos.to )
      pos.loc.start.ch += i
      pos.loc.end.ch = pos.loc.start.ch + 1

      patternObject.marker = marker = cm.markText( pos.loc.start, pos.loc.end, { className:`step_${ patternObject.id }_${i} euclid` })
      track.markup.textMarkers.pattern[ i ] = marker
    }
  }
  
  mark()

  let span
  const update = () => {
    let currentIdx = update.currentIndex // count++ % step.value.length

    if( span !== undefined ) {
      span.remove( 'euclid0' )
      //span.remove( 'euclid1' )
    }

    let spanName = `.step_${patternObject.id}_${currentIdx}`
        //currentValue = patternObject.update.value.pop() //step.value[ currentIdx ]

    span = $( spanName )

    //if( currentValue !== Gibber.Seq.DO_NOT_OUTPUT ) {
    span.add( 'euclid0' )
    //setTimeout( ()=> { 
    //  span.remove( 'euclid1' ) 
    //  span.add( 'euclid0' )
    //}, 50 )
    //}

    //span.add( 'euclid0' )
  }

  patternObject._onchange = () => {
    //let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
    //Gibber.Environment.animationScheduler.add( () => {
    const pos = track.markup.textMarkers.string.find()
    marker.doc.replaceRange( patternObject.values.join(''), pos.from, pos.to )
    track.markup.textMarkers.string = cm.markText( pos.from, pos.to )
    //console.log( pos, track.markup.textMarkers.string )
    mark( pos.from.line ) 
    //}, delay ) 
  }

  patternObject.update = update
  patternObject.update.value = []

  let currentIndex = 0
  Object.defineProperty( patternObject.update, 'currentIndex', {
    get() { return currentIndex },
    set(v){ 
      currentIndex = v; 
      patternObject.update()
    }
  })

  patternObject.clear = () => {
    track.markup.textMarkers.string = cm.markText( nodePosStart, nodePosEnd, { className:'euclid' })
    patternObject.reset()
  }

  Gibber.subscribe( 'clear', patternObject.clear )

  Marker._addPatternFilter( patternObject )
}  


},{"./../../utility.js":48}],8:[function(require,module,exports){

const Utility = require('./../../utility.js')
const $ = Utility.create
const EuclidAnnotation = require( '../update/euclidAnnotation.js' )

module.exports = function( node, cm, track, objectName, state, cb ) {
  const Marker = Gibber.Environment.codeMarkup 
  const steps = node.arguments[ 0 ].properties
  const Identifier = Marker.patternMarkupFunctions.Identifier

  track.markup.textMarkers[ 'step' ] = []
  track.markup.textMarkers[ 'step' ].children = []

  const hexSteps = window[ objectName ]
  const objectClassName = objectName + '_steps'

  let count = 0
  for( let key in steps ) {
    let step = steps[ key ].value

    if( step && step.value ) { // ensure it is a correctly formed step
      step.loc.start.line += Marker.offset.vertical - 1
      step.loc.end.line   += Marker.offset.vertical - 1
      step.loc.start.ch   = step.loc.end.column - 1
      step.loc.end.ch     = step.loc.end.column 

      const pattern = hexSteps.seqs[ steps[ key ].key.value ].timings

      // we estimate whether or not a comma was used to separate between
      // key / value pairs. If there's more than one pattern and this
      // isn't the last time through the for loop, we assume there is a 
      // comma (otherwise an error would occur).
      const useComma = count++ != steps.length - 1 && steps.length > 1

      if( useComma === true ) {
        // move off of end quote to comma
        step.loc.start.ch += 1
        step.loc.end.ch += 1

        // replace comma with a comma and a space
        cm.replaceRange( ", ", step.loc.start, step.loc.end )

        step.loc.start.ch += 1
        step.loc.end.ch += 1
      }else{
        // replace end quote with a quote and a space
        cm.replaceRange( "' ", step.loc.start, step.loc.end )

        step.loc.start.ch += 1
        step.loc.end.ch += 1
      }

      let className = objectClassName + '_' + key 

      let marker = cm.markText( step.loc.start, step.loc.end, { className } )
      pattern.update = EuclidAnnotation( pattern, marker, className, cm, track )
      pattern.patternName = className

      // store value changes in array and then pop them every time the annotation is updated
      pattern.update.value = []

      Marker._addPatternFilter( pattern )

      pattern.marker = marker
      /*

      patternObject._onchange = () => {
        let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
        Gibber.Environment.animationScheduler.add( () => {
          marker.doc.replaceRange( patternObject.values.join(''), step.loc.start, step.loc.end )
          mark( step, key, cm, track )
        }, delay ) 
      }
      */
    }
  }

}  


},{"../update/euclidAnnotation.js":13,"./../../utility.js":48}],9:[function(require,module,exports){

const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = function( node, cm, track, objectName, vOffset=0 ) {
  let timelineNodes = node.arguments[ 0 ].elements
  //console.log( timelineNodes )
  track.markup.textMarkers[ 'score' ] = []

  for( let i = 0; i < timelineNodes.length; i+=2 ) {
    let timeNode = timelineNodes[ i ],
      functionNode = timelineNodes[ i + 1 ]

    functionNode.loc.start.line += vOffset - 1
    functionNode.loc.end.line   += vOffset - 1
    functionNode.loc.start.ch = functionNode.loc.start.column
    functionNode.loc.end.ch = functionNode.loc.end.column

    let marker = cm.markText( functionNode.loc.start, functionNode.loc.end, { className:`score${i/2}` } )
    track.markup.textMarkers[ 'score' ][ i/2 ] = marker

  }

  let lastClass = 'score0'
  $( '.' + lastClass ).add( 'scoreCurrentIndex' )
  // TODO: global object usage is baaaad methinks?
  
  window[ objectName ].onadvance = ( idx ) => {
    $( '.' + lastClass ).remove( 'scoreCurrentIndex' )
    lastClass = `score${idx}`
    $( '.' + lastClass ).add( 'scoreCurrentIndex' ) 
  }
}

},{"./../../utility.js":48}],10:[function(require,module,exports){
const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = function( node, cm, track, objectName, state, cb ) {
  const Marker = Gibber.Environment.codeMarkup // tsk tsk tsk global...
  const steps = node.arguments[ 0 ].properties

  track.markup.textMarkers[ 'step' ] = []
  track.markup.textMarkers[ 'step' ].children = []

  const mark = ( _step, _key, _cm, _track ) => {
    for( let i = 0; i < _step.value.length; i++ ) {
      let pos = { loc:{ start:{}, end:{}} }
      Object.assign( pos.loc.start, _step.loc.start )
      Object.assign( pos.loc.end  , _step.loc.end   )
      pos.loc.start.ch += i
      pos.loc.end.ch = pos.loc.start.ch + 1
      let posMark = _cm.markText( pos.loc.start, pos.loc.end, { className:`step_${_key}_${i}` })
      _track.markup.textMarkers.step[ _key ].pattern[ i ] = posMark
    }
  }

  for( let key in steps ) {
    let step = steps[ key ].value

    if( step && step.value ) { // ensure it is a correctly formed step
      step.loc.start.line += Marker.offset.vertical - 1
      step.loc.end.line   += Marker.offset.vertical - 1
      step.loc.start.ch   = step.loc.start.column + 1
      step.loc.end.ch     = step.loc.end.column - 1

      let marker = cm.markText( step.loc.start, step.loc.end, { className:`step${key}` } )
      track.markup.textMarkers.step[ key ] = marker

      track.markup.textMarkers.step[ key ].pattern = []

      mark( step, key, cm, track )

      let count = 0, span, update,
        _key = steps[ key ].key.value,
        patternObject = window[ objectName ].seqs[ _key ].values

      update = () => {
        let currentIdx = update.currentIndex // count++ % step.value.length

        if( span !== undefined ) {
          span.remove( 'euclid0' )
          span.remove( 'euclid1' )
        }

        let spanName = `.step_${key}_${currentIdx}`,
          currentValue = patternObject.update.value.pop() //step.value[ currentIdx ]

        span = $( spanName )

        if( currentValue !== Gibber.Seq.DO_NOT_OUTPUT ) {
          span.add( 'euclid1' )
          setTimeout( ()=> { span.remove( 'euclid1' ) }, 50 )
        }

        span.add( 'euclid0' )
      }

      patternObject._onchange = () => {
        let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
        Gibber.Environment.animationScheduler.add( () => {
          marker.doc.replaceRange( patternObject.values.join(''), step.loc.start, step.loc.end )
          mark( step, key, cm, track )
        }, delay ) 
      }

      patternObject.update = update
      patternObject.update.value = []

      Marker._addPatternFilter( patternObject )
    }
  }

}  


},{"./../../utility.js":48}],11:[function(require,module,exports){
module.exports = ( patternObject, marker, className, cm ) => {
  patternObject.commentMarker = marker
  let update = () => {

    if( !patternObject.commentMarker ) return
    let patternValue = '' + patternObject.update.value


    if( patternValue.length > 8 ) patternValue = patternValue.slice(0,8) 

    let val ='/* ' + patternValue + ' */',
      pos = patternObject.commentMarker.find(),
      end = Object.assign( {}, pos.to )

    //pos.from.ch += 1
    end.ch = pos.from.ch + val.length 
    //pos.from.ch += 1

    cm.replaceRange( val, pos.from, pos.to )

    if( patternObject.commentMarker ) patternObject.commentMarker.clear()

    patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false })

  }

  patternObject.clear = () => {
    try{
      let commentPos = patternObject.commentMarker.find()
      //commentPos.to.ch -= 1 // XXX wish I didn't have to do this
      cm.replaceRange( '', commentPos.from, commentPos.to )
      patternObject.commentMarker.clear()
      delete patternObject.commentMarker
    } catch( e ) {} // yes, I just did that XXX 
  }

  return update
}


},{}],12:[function(require,module,exports){
const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = function( classNamePrefix, patternObject ) {
  let modCount = 0,
      lastBorder = null,
      lastClassName = null

  const cycle = function( isArray = false ) {
    let className = '.' + classNamePrefix,
        border = 'top'

    // accommodate arrays
    if( patternObject.values.length > 1 || patternObject.type === 'Lookup' || isArray === true ) {
      className += '_' + patternObject.update.currentIndex
    }

    isArray = false 

    switch( modCount++ % 4 ) {
      case 1: border = 'right'; break;
      case 2: border = 'bottom'; break;
      case 3: border = 'left'; break;
    }

    // for a pattern holding arrays... like for chord()
    if( isArray === true ) {
      switch( border ) {
        case 'left':
          $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' )
          $( className + '_start' ).add( 'annotation-left-border-cycle' )

          break;
        case 'right':
          $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' ) 
          $( className + '_end' ).add( 'annotation-right-border-cycle' )

          break;
        case 'top':
          $( className ).add( 'annotation-top-border-cycle' )
          $( className+'_start' ).remove( 'annotation-left-border-cycle' )
          $( className+'_start' ).add( 'annotation-top-border-cycle' )
          $( className+'_end' ).add( 'annotation-top-border-cycle' )

          break;
        case 'bottom':
          $( className ).add( 'annotation-bottom-border-cycle' )
          $( className+'_end' ).remove( 'annotation-right-border-cycle' )
          $( className+'_end' ).add( 'annotation-bottom-border-cycle' )
          $( className+'_start' ).add( 'annotation-bottom-border-cycle' )

          break;
        default:
          //$( className ).add( 'annotation-' + border + '-border-cycle' )
          $( className+'_start' ).remove( 'annotation-' + border + '-border-cycle' )
          $( className+'_end' ).remove( 'annotation-' + border + '-border-cycle' )
          break;
      }

    }else{
      $( className ).remove( 'annotation-' + border + '-border' )
      $( className ).add( 'annotation-' + border + '-border-cycle' )

      if( lastBorder !== null ) {
        $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' )
        $( className ).add( 'annotation-' + lastBorder + '-border' )
      }
    }

    lastBorder = border
    lastClassName = className
  }

  cycle.clear = function() {
    modCount = 1

    if( lastClassName !== null ) {
      $( lastClassName ).remove( 'annotation-left-border' )
      $( lastClassName ).remove( 'annotation-left-border-cycle' )
      $( lastClassName ).remove( 'annotation-right-border' )
      $( lastClassName ).remove( 'annotation-right-border-cycle' )
      $( lastClassName ).remove( 'annotation-top-border' )
      $( lastClassName ).remove( 'annotation-top-border-cycle' )
      $( lastClassName ).remove( 'annotation-bottom-border' )
      $( lastClassName ).remove( 'annotation-bottom-border-cycle' )
    }

    lastBorder = null
  }

  // XXX need to delay timing annotations in case value annotations changes underlying text, in
  // which case the underlying CSS of the line gets all wonky.
  const __cycle = patternObject.__delayAnnotations = true ? ()=> { setTimeout( cycle, 0 ) } : cycle

  // must create reference to original clear function so that it can be called via the delayed wrapper
  // if needed... if not needed, the below assignment is a no-op.
  __cycle.clear = cycle.clear

  return __cycle
}


},{"./../../utility.js":48}],13:[function(require,module,exports){
const Utility = require('./../../utility.js')
const $ = Utility.create

module.exports = ( patternObject, marker, className, cm, track, patternNode, Marker ) => {
  let val ='/* ' + patternObject.values.join('')  + ' */',
      pos = marker.find(),
      end = Object.assign( {}, pos.to ),
      annotationStartCh = pos.from.ch + 3,
      annotationEndCh   = annotationStartCh + 1,
      memberAnnotationStart   = Object.assign( {}, pos.from ),
      memberAnnotationEnd     = Object.assign( {}, pos.to ),
      initialized = false,
      markStart = null,
      commentMarker,
      currentMarker, chEnd

  patternObject.__delayAnnotations = false
  end.ch = pos.from.ch + val.length

  pos.to.ch -= 1
  cm.replaceRange( val, pos.from, pos.to )

  patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false })

  if( track.markup === undefined ) Marker.prepareObject( track )
  track.markup.textMarkers[ className ] = {}

  let mark = () => {
    // first time through, use the position given to us by the parser
    let range,start, end
    if( initialized === false ) {
      memberAnnotationStart.ch = annotationStartCh
      memberAnnotationEnd.ch   = annotationEndCh
      initialized = true
    }else{
      // after the first time through, every update to the pattern store the current
      // position of the first element (in markStart) before replacing. Use this to generate position
      // info. REPLACING TEXT REMOVES TEXT MARKERS.
      range = markStart
      start = range.from
      memberAnnotationStart.ch = start.ch
      memberAnnotationEnd.ch = start.ch + 1 
    }

    for( let i = 0; i < patternObject.values.length; i++ ) {
      track.markup.textMarkers[ className ][ i ] = cm.markText(
        memberAnnotationStart,  memberAnnotationEnd,
        { 'className': `${className}_${i} euclid` }
      )

      memberAnnotationStart.ch += 1
      memberAnnotationEnd.ch   += 1
    }

    if( start !== undefined ) {
      start.ch -= 3
      end = Object.assign({}, start )
      end.ch = memberAnnotationEnd.ch + 3
      patternObject.commentMarker = cm.markText( start, end, { className, atomic:true })
    }
  }

  mark()

  // XXX: there's a bug when you sequence pattern transformations, and then insert newlines ABOVE the annotation
  let count = 0, span, update, activeSpans = []

  update = () => {
    // XXX what happened??? this should be incremented by 1, and there
    // should be no need for Math.floor
    count += .5
    let currentIdx = Math.floor( count ) % patternObject.values.length

    if( span !== undefined ) {
      span.remove( 'euclid0' )
    }

    let spanName = `.${className}_${currentIdx}`,
        currentValue = patternObject.values[ currentIdx ]

    span = $( spanName )

    // deliberate ==
    if( currentValue == 1 ) {
      span.add( 'euclid0' )
      span.add( 'euclid1' )
      activeSpans.push( span )
      setTimeout( ()=> { 
        activeSpans.forEach( _span => _span.remove( 'euclid1' ) )
        activeSpans.length = 0 
      }, 50 )
    }else{
      span.add( 'euclid0' )
    }
  }

  patternObject._onchange = () => {
    //let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )

    // markStart is a closure variable that will be used in the call
    // to mark()
    markStart = track.markup.textMarkers[ className ][ 0 ].find()

    //Gibber.Environment.animationScheduler.add( () => {
      for( let i = 0; i < patternObject.values.length; i++ ) {

        let markerCh = track.markup.textMarkers[ className ][ i ],
            pos = markerCh.find()

        marker.doc.replaceRange( '' + patternObject.values[ i ], pos.from, pos.to )
      }
      mark()
    //}, delay ) 
  }

  patternObject.clear = () => {
    const commentPos = patternObject.commentMarker.find()

    // if this gets called twice...
    if( commentPos === undefined ) return

    // check to see if the last character is a parenthesis... if so we could
    // not add 1 to commentPos.to.ch so that we don't accidentally delete it.
    const end = { line:commentPos.to.line, ch:commentPos.to.ch+1 } 
    const text = cm.getRange( commentPos.from, end )
    const replacement = text[ text.length - 1 ] === ')' ? ')' : '' 

    cm.replaceRange( replacement, commentPos.from, end )
    patternObject.commentMarker.clear()
  }

  Gibber.subscribe( 'clear', patternObject.clear )

  return update 
}


},{"./../../utility.js":48}],14:[function(require,module,exports){
module.exports = ( patternObject, marker, className, cm, track, patternNode, patternType, seqNumber ) => {
  Gibber.Environment.codeMarkup.processGen( patternNode, cm, null, patternObject, null, -1 )

  patternNode.arguments[1].offset = patternNode.offset 

  Gibber.Environment.codeMarkup.patternMarkupFunctions.ArrayExpression(
    patternNode.arguments[1], 
    cm.__state,
    { object:patternObject, [ patternType ]: patternObject },
    patternType,
    null,
    seqNumber,
    true 
  )
}


},{}],15:[function(require,module,exports){
module.exports = function( Marker ) {

  const strip = function( unstripped ) {
    const stripped   = unstripped[0] === '"' || unstripped[0] === "'" ? unstripped.slice(1,-1) : unstripped
    return stripped
  }

  const visitors = {
    Literal( node, state, cb ) {
      state.push( node.value )
    },
    Identifier( node, state, cb ) {
      state.push( strip( node.name ) )
    },
    AssignmentExpression( expression, state, cb ) {
      // first check to see if the right operand is a callexpression
      if( expression.right.type === 'CallExpression' ) {

                
        let name
        if( expression.right.callee.type === 'MemberExpression' ) {
          // check to see if this is a constructor followed by a call to .seq() or .connect()
          try {
            if( expression.right.callee.object.callee === undefined ) {
              if( expression.right.callee.object.object.type === 'CallExpression' ) {
                Marker.globalIdentifiers[ expression.left.name ] = expression.right 
                visitors.CallExpression( expression.right, state, cb, window[ expression.left.name ], expression.left.name )
                return
              }
            }else{
              name = expression.right.callee.object.callee.name
            }
          }catch(e) {
            console.error( 'complex assignment / member expression:', e, expression.right )
          }
        }else{
          name = expression.right.callee.name
        }

        if( name !== undefined && Marker.standalone[ name ] ) {

          const obj = window[ expression.left.name ]
          if( obj.markup === undefined ) Marker.prepareObject( obj )

          Marker.standalone[ name ]( 
            expression.right, 
            state.cm,
            obj,
            expression.left.name,
            state,
            cb
          )            
        }else{
          // if it's a gen~ object we need to store a reference so that we can create wavepattern
          // annotations when appropriate.
          const left = expression.left
          const right= expression.right
          
          Marker.globalIdentifiers[ left.name ] = right

          let righthandName
          if( right.callee.object === undefined ) {
            // no calls to .connect() or to .seq()
            righthandName = right.callee.name
          }else{
            // ugen({}).connect()
            // XXX what about handling multiple chained calls to .seq()
            // hopefully this is handled in our earlier try/catch block...

            if( right.callee.object.callee !== undefined ) 
              righthandName = right.callee.object.callee.name 
          }

          if( righthandName !== undefined ) {
            state.containsGen = Marker.Gibber.Gen.names.indexOf( righthandName ) > -1
            state.gen = window[ left.name ]

            // XXX does this need a track object? passing null...
            if( state.containsGen ) Marker.processGen( expression, state.cm, null )
          }

          cb( right, state )

        }
      }
    },
    
    CallExpression( node, state, cb, obj, objName ) {
      // this one is a doozy. The first thing to note is that this can either be called
      // during a recursive walk whenever a CallExpression is found, or it can be called
      // directly from the AssignmentExpression visitor, which will often have a
      // CallExpression on the righthand side (for example, ugen().connect()). 

      // If called from the AssignmentExpression visitor, the sequencer that is created
      // will be passed in to the argumenet obj. If this is not passed in, then we need
      // to update the state of the walk by calling the callback. 
      if( obj === undefined && state.containsGen !== true ) cb( node.callee, state )

      // check the state for a member .seq. We use two different techniques for this. 
      // the first finds things like "mysynth.note.seq( 0,0 )" while the second finds
      // calls to constructors that are chained with calls to .seq()
      // (e.g. "synth = Synth().note.seq( 0, 1/4 )"

      const endIdx = state.length - 1
      const end = state[ endIdx ]
      let foundSequence = end === 'seq'

      if( node.callee.property !== undefined ) {
        foundSequence = node.callee.property.name === 'seq'
      }

      if( foundSequence === true ){
        // check if a gen ugen is stored in the state variable, if so
        // use it as the obj varibale.
        if( state.containsGen === true ) obj = state.gen

        // If called via the AssignmentExpression visitor, built up a faux-AST
        // that gives us the object and all subsequenct method calls. For example,
        // there could be many chained calls to .seq() sequencing different
        // properties. 
        let tree
        if( obj !== undefined ) {
          tree = []
          let __node = node
          while( (__node =__node.callee || __node.object) !== undefined ) {
            if( __node.property )
              tree.unshift( __node.property.name )
            else if( __node.name )
              tree.unshift( __node.name )
          }
          // tree should be of form: ['Synth', 'note', 'seq', 'gain', 'seq'...]
        }

        let seq

        if( obj === undefined ) {
          // assume default sequencer ID of 0, but check for alternative argument value
          let seqNumber = node.arguments.length > 2 ? node.arguments[2].raw : 0

          seq = Marker.getObj( state.slice( 0, endIdx ), true, seqNumber )
          Marker.markPatternsForSeq( seq, node.arguments, state, cb, node, seqNumber )
        }else{
          // as top most level of AST is the last call to .seq, we must work our way
          // from the top on down. Here we look up the name of each property being
          // sequence from the faux-AST we created earlier. We then pass in the 
          // MemberExpression nod ethat was used to sequence this property. 
          for( let i = tree.length - 2; i >= 1; i-=2 ) {
            let seqNumber = node.arguments.length > 2 ? node.arguments[2].raw : 0

            try {
              seq = obj[ tree[i] ][ seqNumber ]
            }catch(e) {
              console.log( e )
              //debugger
              cb( node.callee, state )
              return
            }

            // check and see if the object name has been passed, if not we should be
            // able to get it from the first index of the tree
            if( objName === undefined ) objName = tree[ 0 ]

            // We need to fake a state variable so that annotations are created with
            // unique class names. We pass the name of the object being sequenced 
            // as well as the method and sequencer number used.
            let __state = [ objName, tree[ i ] ]
            __state.cm = state.cm
            Marker.markPatternsForSeq( seq, node.arguments, __state, cb, node, seqNumber )
            node = node.callee.object.object
          }

        }

        //console.log( 'marking pattern for seq:', seq )
      }else{
        // XXX need to fix this when we add gen~ expressions back in!!!
        if( node.callee.object !== undefined && node.callee.object.type !== 'Identifier' && node.callee.property ) {
          if( node.callee.property.name === 'fade' ) {
            Marker.processFade( state, node )
          }
        }
        cb( node.callee, state )
        //Marker.processGen( node, state.cm, null, null, null, state.indexOf('seq') > -1 ? 0 : -1, state )
      }

    },
    MemberExpression( node, state, cb ) {
      // XXX why was this here?
      //if( node.object.name === 'tracks' ) state.length = 0

      // for any member name, make sure to get rid of potential quotes surrounding it using
      // the strip function.
      
      if( node.object.type !== 'Identifier' ) {
        if( node.property ) {
          const unstripped = node.property.type === 'Identifier' ? node.property.name : node.property.raw 
          state.unshift( strip( unstripped ) )
        }
        cb( node.object, state )
      }else{
        if( node.property !== undefined ) { // if the objects is an array member, e.g. tracks[0]
          state.unshift( strip( node.property.raw || node.property.name ) )
        }
        state.unshift( strip( node.object.name ) )

        //cb( node.object, state )
      }
    },
  }

  return visitors
}

},{}],16:[function(require,module,exports){
const COLORS = {
  FILL:'rgba(46,50,53,1)',
  STROKE:'#aaa',
  DOT:'rgba(89, 151, 198, 1)'//'rgba(0,0,255,1)'
}

let Gibber = null

const Waveform = {
  widgets: { dirty:false },

  // we use this flag to start the animation clock if needed.
  initialized: false,
  
  // we pass in the state from the AST walk because that's the simplest place to store 
  // a reference to the genish object that should be tied to the widge we are
  // creating.

  // XXX there's a bucnh of arguments  that could probably be removed from this function. 
  // Definitely closeParenStart, probably also isAssignment, maybe track & patternObject.
  createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject=null, track, isSeq=true, walkState ) {
    let widget = document.createElement( 'canvas' )
    widget.padding = 40
    widget.waveWidth = 60
    widget.ctx = widget.getContext('2d')
    widget.style.display = 'inline-block'
    widget.style.verticalAlign = 'middle'
    widget.style.height = '1.1em'
    widget.style.width = ((widget.padding * 2 + widget.waveWidth) * window.devicePixelRation ) + 'px'
    widget.style.backgroundColor = 'transparent'
    widget.style.margin = '0 1em'
    widget.style.borderLeft = '1px solid #666'
    widget.style.borderRight = '1px solid #666'
    widget.setAttribute( 'width', widget.padding * 2 + widget.waveWidth )
    widget.setAttribute( 'height', 13 )
    widget.ctx.fillStyle = COLORS.FILL 
    widget.ctx.strokeStyle = COLORS.STROKE
    widget.ctx.font = '10px monospace'
    widget.ctx.lineWidth = 1
    widget.gen = patternObject !== null ? patternObject : walkState.gen//Gibber.Gen.lastConnected.shift()
    widget.values = []
    widget.storage = []
    widget.min = 10000
    widget.max = -10000

    let isFade = false

    // is it a fade?
    if( widget.gen.from !== undefined ) {
      widget.min = widget.gen.from.value
      widget.max = widget.gen.to.value
      isFade = true
      widget.gen = widget.gen.__wrapped__
      widget.values = widget.gen.values
    }

    if( widget.gen === null || widget.gen === undefined ) {
      if( node.expression !== undefined && node.expression.type === 'AssignmentExpression' ) {
        isAssignment = true
        
        widget.gen = window[ node.expression.left.name ]

        if( widget.gen.widget !== undefined ) {
          widget.gen.widget.parentNode.removeChild( widget.gen.widget )
        }
        widget.gen.widget = widget
      }else if( node.type === 'CallExpression' ) {
        const state = cm.__state
        
        if( node.callee.name !== 'Lookup' && node.callee.property.name !== 'fade' ) {
          const objName = `${state[0]}`
          const track  = window.signals[0]//window[ objName ][ state[1] ]
          let wave
          if( state.length > 2 ) {
            wave = track[ node.callee.object.property.value][ node.arguments[2].value ] 
          }else{
            wave = track() 
          }

          if( wave !== undefined && wave.values.type === 'WavePattern' ) {
            widget.gen = wave.values
            widget.gen.paramID += '_' + node.arguments[2].value
          }
          isAssignment = true
        }else{
          widget.gen = patternObject
        }
      } 
    }else{
      if( widget.gen.widget !== undefined && widget.gen.widget !== widget ) {
        isAssignment = true
        //widget.gen = window[ node.expression.left.name ]
      }
    }

    widget.mark = cm.markText({ line, ch:ch }, { line, ch:ch+1 }, { replacedWith:widget })
    widget.mark.__clear = widget.mark.clear

    widget.mark.clear = function() { 
      const pos = widget.mark.find()
      if( pos === undefined ) return
      widget.mark.__clear()

      if( isSeq === true ) { // only replace for waveforms inside of a .seq() call
        cm.replaceRange( '', { line:pos.from.line, ch:pos.from.ch }, { line:pos.from.line, ch:pos.to.ch } ) 
      }
    }

    widget.clear = ()=> {
      delete Waveform.widgets[ widget.gen.id ]
      widget.mark.clear() 
    }

    if( widget.gen !== null && widget.gen !== undefined ) {
      //console.log( 'paramID = ', widget.gen.paramID ) 
      Waveform.widgets[ widget.gen.id ] = widget
      widget.gen.widget = widget
      widget.gen.__onclear = ()=> widget.mark.clear()
    }
    
    if( patternObject !== null ) {
      patternObject.mark = widget.mark
      if( patternObject === Gibber.Gen.lastConnected[0] ) Gibber.Gen.lastConnected.shift()
    }

    if( !isFade ) {
      widget.onclick = ()=> {
        widget.min = Infinity
        widget.max = -Infinity
        widget.storage.length = 0
      }
    }
    

    if( this.initialized === false ) {
      this.startAnimationClock()
      this.initialized = true
    }

    widget.isFade = isFade
  },

  clear() {
    for( let key in Waveform.widgets ) {
      let widget = Waveform.widgets[ key ]
      if( typeof widget === 'object' ) {
        widget.mark.clear()
        //widget.parentNode.removeChild( widget )
      }
    }

    Waveform.widgets = { dirty:false }
  },

  startAnimationClock() {
    const clock = function(t) {
      Waveform.drawWidgets()
      window.requestAnimationFrame( clock )
    }

    clock()
  },

  // currently called when a network snapshot message is received providing ugen state..
  // needs to also be called for wavepatterns.
  updateWidget( id, __value, isFromMax = true ) {
    const widget = typeof id !== 'object' ? Waveform.widgets[ id ] : id
    if( widget === undefined ) return 

    let value = parseFloat( __value )

    // XXX why does beats generate a downward ramp?
    if( isFromMax ) value = 1 - value

    if( typeof widget.values[60] !== 'object' ) {
      widget.values[ 60 ] = value
      widget.storage.push( value )
    }

    if( widget.storage.length > 240 ) {
      widget.max = Math.max.apply( null, widget.storage )
      widget.min = Math.min.apply( null, widget.storage )
      widget.storage.length = 0
    } else if( value > widget.max ) {
      widget.max = value
    }else if( value < widget.min ) {
      widget.min = value
    } 

    widget.values.shift()

    Waveform.widgets.dirty = true

  },

  // called by animation scheduler if Waveform.widgets.dirty === true
  drawWidgets() {
    Waveform.widgets.dirty = false

    const drawn = []

    for( let key in Waveform.widgets ) {
      if( key === 'dirty' ) continue

      const widget = Waveform.widgets[ key ]

      if( widget === undefined ) continue

      // ensure that a widget does not get drawn more
      // than once per frame
      if( drawn.indexOf( widget ) !== -1 ) continue

      if( typeof widget === 'object' && widget.ctx !== undefined ) {

        widget.ctx.fillStyle = COLORS.FILL
        widget.ctx.fillRect( 0,0, widget.width, widget.height )

        // draw left border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + .5, 0.5 )
        widget.ctx.lineTo( widget.padding + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw right border
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding + widget.waveWidth + .5, .5 )
        widget.ctx.lineTo( widget.padding + widget.waveWidth + .5, widget.height + .5 )
        widget.ctx.stroke()

        // draw waveform
        widget.ctx.beginPath()
        widget.ctx.moveTo( widget.padding,  widget.height / 2 + 1 )

        const range = widget.max - widget.min
        const wHeight = (widget.height * .85 + .45) - 1

        // needed for fades
        let isReversed = false

        if( widget.isFade !== true ) {
          for( let i = 0, len = widget.waveWidth; i < len; i++ ) {
            const data = widget.values[ i ]
            const shouldDrawDot = typeof data === 'object'
            const value = shouldDrawDot ? data.value : data
            const scaledValue = ( value - widget.min ) / range

            const yValue = scaledValue * (wHeight) - 1.5 
            
            if( shouldDrawDot === true ) {
              widget.ctx.fillStyle = COLORS.DOT
              widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue )
              widget.ctx.fillRect( i + widget.padding - 1, wHeight - yValue - 1.5, 3, 3)
            }else{
              widget.ctx.lineTo( i + widget.padding + .5, wHeight - yValue )
            }
          }
        }else{
          isReversed = ( widget.gen.from > widget.gen.to )

          if( !isReversed ) {
            widget.ctx.moveTo( widget.padding, widget.height )
            widget.ctx.lineTo( widget.padding + widget.waveWidth, 0 )
          }else{
            widget.ctx.moveTo( widget.padding, 0 )
            widget.ctx.lineTo( widget.padding + widget.waveWidth, widget.height )
          }

          const value = widget.values[0]
          if( !isNaN( value ) ) {
            let percent = isReversed === true ? Math.abs( value / (range+widget.gen.from) ) : value / (range+widget.gen.from)

            if( !isReversed ) {
              widget.ctx.moveTo( widget.padding + ( Math.abs( percent ) * widget.waveWidth ), widget.height )
              widget.ctx.lineTo( widget.padding + ( Math.abs( percent ) * widget.waveWidth ), 0 )
            }else{
              widget.ctx.moveTo( widget.padding + ( (1-percent) * widget.waveWidth ), widget.height )
              widget.ctx.lineTo( widget.padding + ( (1-percent) * widget.waveWidth ), 0 )
            }

            // XXX we need to also check if the next value would loop the fade
            // in which case finalizing wouldn't actually happen... then we
            // can get rid of magic numbers here.
            if( isReversed === true ) {
              //console.log( 'reverse finalized', percent, widget.gen.from, widget.gen.to )
              if( percent <= 0.01) widget.gen.finalize()
            }else{
              //console.log( 'finalized', percent, value, range, widget.gen.from, widget.gen.to )
              if( percent >= .99 ) widget.gen.finalize()
            }
          }

        }
        widget.ctx.stroke()

        const __min = isReversed === false ? widget.min.toFixed(2) : widget.max.toFixed(2)
        const __max = isReversed === false ? widget.max.toFixed(2) : widget.min.toFixed(2)

        // draw min/max
        widget.ctx.fillStyle = COLORS.STROKE
        widget.ctx.textAlign = 'right'
        widget.ctx.fillText( __min, widget.padding - 2, widget.height )
        widget.ctx.textAlign = 'left'
        widget.ctx.fillText( __max, widget.waveWidth + widget.padding + 2, widget.height / 2 )

        // draw corners
        widget.ctx.beginPath()
        widget.ctx.moveTo( .5, 3.5 )
        widget.ctx.lineTo( .5, .5 )
        widget.ctx.lineTo( 3.5, .5)

        widget.ctx.moveTo( .5, widget.height - 3.5 )
        widget.ctx.lineTo( .5, widget.height - .5 )
        widget.ctx.lineTo( 3.5, widget.height - .5 )

        const right = widget.padding * 2 + widget.waveWidth - .5
        widget.ctx.moveTo( right, 3.5 )
        widget.ctx.lineTo( right, .5 ) 
        widget.ctx.lineTo( right - 3, .5 )

        widget.ctx.moveTo( right, widget.height - 3.5 )
        widget.ctx.lineTo( right, widget.height - .5 ) 
        widget.ctx.lineTo( right - 3, widget.height - .5 )

        widget.ctx.stroke()

        drawn.push( widget )
      }
    }
  }
}

module.exports = function( __Gibber ) {
  Gibber = __Gibber
  return Waveform
}

},{}],17:[function(require,module,exports){

const acorn = require( 'acorn' )
const walk  = require( 'acorn-walk' )
//const Utility = require( '../js/utility.js' )

module.exports = function( Gibber ) {

const Marker = {
  waveform: require( './annotations/waveform.js' )( Gibber ),
  _patternTypes: [ 'values', 'timings', 'index' ],
  globalIdentifiers:{},
  Gibber,

  acorn, walk,

  // need ecmaVersion 7 for arrow functions to work correctly
  parsingOptions: { locations:true, ecmaVersion:7 },

  __visitors:require( './annotations/visitors.js' ),

  // pass Marker object to patternMarkupFunctions as a closure
  init() { 
    for( let key in this.patternMarkupFunctions ) {
      if( key.includes( '_' ) === true ) {
        this.patternMarkupFunctions[ key.slice(2) ] = this.patternMarkupFunctions[ key ]( this )
      }
    }

    this.visitors = this.__visitors( this )

    Gibber.subscribe( 'clear', this.clear )
  },

  clear() { Marker.waveform.clear() },
  
  prepareObject( obj ) {
    obj.markup = {
      textMarkers: {},
      cssClasses:  {} 
    }  
  },

  getObj( path, findSeq = false, seqNumber = 0 ) {
    let obj = window[ path[0] ]

    for( let i = 1; i < path.length; i++ ) {
      let key = path[ i ]
      if( key !== undefined ) {
        if( key[0] === "'" || key[0] === '"' ) {
          key = key.slice(1,-1)
        }
        obj = obj[ key ]
      }else{
        break;
      }
    }

    if( findSeq === true && obj !== undefined ) {
      if( obj.type !== 'sequence' ) {
        obj = obj[ seqNumber ]
      } 
    }

    return obj
  },
  

  // STARTING POINT FOR PARSING / MARKUP
  process( code, position, codemirror, track ) {
    // store position offset from top of code editor
    // to use when marking patterns, since acorn will produce
    // relative offsets 
    Marker.offset = {
      vertical:   position.start.line,
      horizontal: position.horizontalOffset === undefined ? 0 : position.horizontalOffset
    }

    const state = []
    state.cm = codemirror
    state.cm.__state = state

    const parsed = acorn.parse( code, Marker.parsingOptions )
      
    Gibber.Gibberish.proxyEnabled = false

    parsed.body.forEach( node => {
      state.length = 0
      state.containsGen = false

      try{
        walk.recursive( node, state, Marker.visitors )
      }catch(e){
        console.warn('Annotation error ->', e )
      }
    })

    Gibber.Gibberish.proxyEnabled = true
  },
  
  markPatternsForSeq( seq, nodes, state, cb, container, seqNumber = 0 ) {
    const valuesNode = nodes[0]
    valuesNode.offset = Marker.offset
    
    // XXX We have to markup the timings node first, as there is the potential for 
    // markup on the value node to insert text that will alter the range of the timings node.
    // If the timings node is already marked up, the mark will simply move with the text addition.
    // However, if the timing mode is marked up after, the position information provided by the parser
    // will be off and not valid.
    
    if( nodes[1] !== undefined ) {
      const timingsNode = nodes[1] 
      timingsNode.offset = Marker.offset
      Marker.patternMarkupFunctions[ timingsNode.type ]( timingsNode, state, seq, 'timings', container, seqNumber )
    }

    Marker.patternMarkupFunctions[ valuesNode.type ]( valuesNode, state, seq, 'values', container, seqNumber )
  },

  
  processGen( node, cm, track, patternObject=null, seq=null, lineMod=0, state ) {
    let ch = node.loc.end.column, 
        line = Marker.offset.vertical + node.loc.start.line, 
        closeParenStart = ch - 1, 
        end = node.end,
        isAssignment = true 

    // check to see if a given object is a proxy that already has
    // a widget created; if so, don't make another one!
    if( node.type === 'AssignmentExpression' ) {
      const __obj = window[ node.left.name ]

      if( __obj !== undefined ) {
        if( __obj.widget !== undefined ) {
          return
        }

        const characterStart = node.loc.start.line === 0 ? ch - 1 : ch - (node.loc.start.line)
        Marker.waveform.createWaveformWidget( line - 1, closeParenStart, ch-1, isAssignment, node, cm, __obj, track, false )
      }
    }else if( node.type === 'CallExpression' ) {
      const seqExpression = node

      seqExpression.arguments.forEach( function( seqArgument ) {
        if( seqArgument.type === 'CallExpression' ) {
          const idx = Gibber.Gen.names.indexOf( seqArgument.callee.name )
          
          // not a gen, markup will happen elsewhere
          if( idx === -1 ) return

          
          ch = seqArgument.loc.end.ch || seqArgument.loc.end.column
          // XXX why don't I need the Marker offset here?
          line = seqArgument.loc.end.line + lineMod

          // for some reason arguments to .seq() include the offset,
          // so we only want to add the offset in if we this is a gen~
          // assignment via function call. lineMod will !== 0 if this
          // is the case.
          if( lineMod !== 0 ) line += Marker.offset.vertical

          closeParenStart = ch - 1
          isAssignment = false
          node.processed = true
          //debugger
          Marker.waveform.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track, lineMod === 0, state )
        } else if( seqArgument.type === 'ArrayExpression' ) {
          //console.log( 'WavePattern array' )
        }else if( seqArgument.type === 'Identifier' ) {
          // handles 'Identifier' when pre-declared variables are passed to methods
          ch = seqArgument.loc.end.ch || seqArgument.loc.end.column
          line = seqArgument.loc.end.line + lineMod
          isAssignment = false
          node.processsed = true

          if( lineMod !== 0 ) line += Marker.offset.vertical
          if( window[ seqArgument.name ].widget === undefined ) {
            Marker.waveform.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track, lineMod === 0 )
          }
        }
      })

    }
    
  },

  processFade( state, node ) { 
    let ch = node.loc.end.column, 
        line = Marker.offset.vertical + node.loc.start.line - 1, 
        closeParenStart = ch, 
        end = node.end

    // check to see if a given object is a proxy that already has
    // a widget created; if so, don't make another one!
    const seqExpression = node

    const gen = window[ state[0] ][ state[ 1 ] ].value
    Marker.waveform.createWaveformWidget( line, closeParenStart, ch-1, false, node, state.cm, gen, null, false, state )
  },

  _createBorderCycleFunction: require( './annotations/update/createBorderCycle.js' ),

  finalizePatternAnnotation( patternObject, className, seqTarget ) {
    patternObject.update =  Marker._createBorderCycleFunction( className, patternObject )

    // automatically trigger annotation update whenever a new currentIndex value is received...
    let currentIndex = 0
    let value = 0
    Object.defineProperty( patternObject.update, 'currentIndex', {
      get() { return currentIndex },
      set(v){ 
        //if( currentIndex !== v ) {
          currentIndex = v
          patternObject.update()
        //}
      }
    })

    // XXX why don't I need this anymore?
    //Object.defineProperty( patternObject.update, 'value', {
    //  get() { return value },
    //  set(v){
    //    //if( value !== v ) {
    //      value = v
    //      patternObject.update()
    //    //}
    //  }
    //})
    //Marker._addPatternUpdates( patternObject, className )
    //Marker._addPatternFilter( patternObject )

    patternObject.patternName = className
    patternObject._onchange = () => { 
      Marker._updatePatternContents( patternObject, className, seqTarget ) 
    }

    patternObject.clear = () => {
      patternObject.marker.clear()
    }

    Gibber.subscribe( 'clear', patternObject.clear )
  },

  // Patterns can have *filters* which are functions
  // that can modify the final output of a pattern and carry out
  // other miscellaneous tasks. Here we add a filter that schedules
  // updates for annotations everytime the target pattern outputs
  // a value.
  _addPatternFilter( patternObject ) {
    patternObject.filters.push( args => {
      const wait = Gibber.Utility.beatsToMs( patternObject.nextTime + .5,  Gibber.Scheduler.bpm ),
            idx = args[ 2 ],
            shouldUpdate = patternObject.update.shouldUpdate

      // delay is used to ensure that timings pattern is processed after values pattern,
      // because changing the mark of the values pattern messes up the mark of the timings
      // pattern; reversing their order of execution fixes this.  
      if( patternObject.__delayAnnotations === true ) {
        Gibber.Environment.animationScheduler.add( () => {
          if( patternObject.type !== 'Lookup' ) {
            patternObject.update.currentIndex = idx
          }else{
            patternObject.update.currentIndex = patternObject.update.__currentIndex.shift()
          }

          patternObject.update()
        }, wait + 1 )
      }else{
        Gibber.Environment.animationScheduler.add( () => {
          if( patternObject.type !== 'Lookup' ) {
            patternObject.update.currentIndex = idx
          }else{
            patternObject.update.currentIndex = patternObject.update.__currentIndex.shift()
          }


         patternObject.update()
        }, wait ) 
      }

      return args
    }) 
  },

  // FunctionExpression and ArrowFunctionExpression are small enough to
  // include here, as they're simply wrappers for Identifier. All other
  // pattern markup functions are in their own files.
  patternMarkupFunctions: {

    __Literal:          require( './annotations/markup/literal.js' ),
    __Identifier:       require( './annotations/markup/identifier.js'   ),
    __UnaryExpression:  require( './annotations/markup/unaryExpression.js'  ),
    __BinaryExpression: require( './annotations/markup/binaryExpression.js' ),
    __ArrayExpression:  require( './annotations/markup/arrayExpression.js'  ),
    __CallExpression:   require( './annotations/markup/callExpression.js'   ),

    // args[ 0 ] is the pattern node
    FunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    },

    ArrowFunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    }
  },

  patternUpdates: {
    Euclid:   require( './annotations/update/euclidAnnotation.js' ),
    Automata: require( './annotations/update/euclidAnnotation.js' ),
    Hex:      require( './annotations/update/euclidAnnotation.js' ),
    Lookup:   require( './annotations/update/lookupAnnotation.js' ),
    anonymousFunction: require( './annotations/update/anonymousAnnotation.js' ),
  },

  standalone: {
    Score: require( './annotations/standalone/scoreAnnotation.js' ),
    Steps: require( './annotations/standalone/stepsAnnotation.js' ),
    HexSteps: require( './annotations/standalone/hexStepsAnnotations.js' ),
    Drums:  require( './annotations/standalone/drumsAnnotation.js' ),
    EDrums: require( './annotations/standalone/drumsAnnotation.js' )
  },


  _updatePatternContents( pattern, patternClassName, track ) {
    let marker, pos, newMarker

    if( Gibber.shouldDelay === false ) {

      // XXX this works fine for pattern *transformations*, but it doesn't work
      // when you're completely replacing the contents of the pattern with a new
      // set of values that has a different length (if the length is the same it's OK).
      // The array needs to be re-annotated on each update if the length has changed.
      
      // const ArrayExpression = function( patternNode, state, seq, patternType, container=null, index=0, isLookup=false ) {
      // XXX we're not going to have access to all the arguments for the array expression markup function. But really what it
      // needs is the pattern node, the name (css name, e.g. a_chord_values_0), the start and the end locations. Everything else
      // can be determiend from these four items. I think we have all of these? We also need access to codemirror, which we can
      // get via any marker (we'll use the patternClass marker).
      // We also need the seq the pattern is assigned to, so we can get at the target object. Actually, the target object is 'track'
      // here, so we can probably just use that.




      if( pattern.values.length > 1 ) {
        /*const cm = track.markup.textMarkers[ patternClassName ].doc
        const node = pattern.node
        const start = node.loc.start
        const end   = node.loc.end
        const target = track

        const arrayExpressionMarkupArgs = {
          cm,node,start,end,target,
          useFakeArgs:true
        }

        cm.replaceText
        */
        // array of values
        for( let i = 0; i < pattern.values.length; i++) {
          marker = track.markup.textMarkers[ patternClassName ][ i ]

          const itemClass = document.querySelector('.' + marker.className.split(' ')[0] )
          if( itemClass !== null )
            itemClass.innerText = pattern.values[ i ]
        }
      }else{
        if( Array.isArray( pattern.values[0] ) ) {
          // for example, to repeatedly sequence a single chord...
          // XXX this is a hack, the patternClassName is submitted to this function
          // incorrectly. But at least it's an easy hack.
          marker = track.markup.textMarkers[ patternClassName ][ 0 ]
          pos = marker.find()

          if( pos !== undefined ) {
            pos.from.ch += 1
            pos.to.ch -=1
            marker.doc.replaceRange( pattern.values[0].toString(), pos.from, pos.to )//, { className:marker.className.replace(' ', '.') })
          }
          //const arrayElement = document.querySelector( '.' + patternClassName )
          //arrayElement.innerText = pattern.values[0]
        }else{
          // single literal
          marker = track.markup.textMarkers[ patternClassName ]

          const itemClass = document.querySelector('.' + marker.className.split(' ')[0] )
          if( itemClass !== null )
            itemClass.innerText = pattern.values[ 0 ]

          //marker.doc.replaceRange( '' + pattern.values[ 0 ], pos.from, pos.to )
          // newMarker = marker.doc.markText( pos.from, pos.to, { className: patternClassName + ' annotation-border' } )
          // track.markup.textMarkers[ patternClassName ] = newMarker
        }
      }
    }
  },

  _getNamesAndPosition( patternNode, state, patternType, index = 0 ) {
    let start   = patternNode.loc.start,
        end     = patternNode.loc.end,
        className = state.slice( 0 ), 
        cssName   = null,
        marker

     className.push( patternType )
     className.push( index )
     className = className.join( '_' )

     let expr = /\[\]/gi
     className = className.replace( expr, '' )

     expr = /\-/gi
     className = className.replace( expr, '_' )

     expr = /\ /gi
     className = className.replace( expr, '_' )

     start.line += patternNode.offset.vertical - 1
     end.line   += patternNode.offset.vertical - 1
     start.ch   = start.column + patternNode.offset.horizontal 
     end.ch     = end.column + patternNode.offset.horizontal 

     return [ className, start, end ]
  },

  _getCallExpressionHierarchy( expr ) {
    let callee = expr.callee,
        obj = callee.object,
        components = [],
        index = 0,
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property && obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property && obj.property.type === 'Literal' ){ // array index
        pushValue = obj.property.value

        // don't fall for tracks[0] etc.
        if( depth > 1 ) index = obj.property.value
      }else if( obj.type === 'Identifier' ) {
        pushValue = obj.name
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    
    if( callee.property )
      components.push( callee.property.name )

    return [ components, depth, index ]
  },

}

return Marker

}



},{"./annotations/markup/arrayExpression.js":1,"./annotations/markup/binaryExpression.js":2,"./annotations/markup/callExpression.js":3,"./annotations/markup/identifier.js":4,"./annotations/markup/literal.js":5,"./annotations/markup/unaryExpression.js":6,"./annotations/standalone/drumsAnnotation.js":7,"./annotations/standalone/hexStepsAnnotations.js":8,"./annotations/standalone/scoreAnnotation.js":9,"./annotations/standalone/stepsAnnotation.js":10,"./annotations/update/anonymousAnnotation.js":11,"./annotations/update/createBorderCycle.js":12,"./annotations/update/euclidAnnotation.js":13,"./annotations/update/lookupAnnotation.js":14,"./annotations/visitors.js":15,"./annotations/waveform.js":16,"acorn":39,"acorn-walk":38}],18:[function(require,module,exports){
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
  Gibber.init( workletPath, new AudioContext({ latencyHint:.05 }), sac )

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
        if( ugen.clear !== undefined ) {
          ugen.clear()
          console.log( 'clearing:', ugen.clear, ugen )
        }else if( ugen.__onclear !== undefined ) {
          // XXX does this condition ever happen?
          ugen.__onclear()     
        }

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

            // make sure to disconnect any fx in the old ugen's fx chain
            member.fx.forEach( effect => { 
              effect.disconnect()
              effect.clear() 
            })
            member.fx.length = 0
          }
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

},{"./codeMarkup.js":17,"standardized-audio-context":46}],19:[function(require,module,exports){
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;
},{}],20:[function(require,module,exports){
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

module.exports = _arrayWithoutHoles;
},{}],21:[function(require,module,exports){
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;
},{}],22:[function(require,module,exports){
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
},{}],23:[function(require,module,exports){
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
},{}],24:[function(require,module,exports){
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
},{}],25:[function(require,module,exports){
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
},{}],26:[function(require,module,exports){
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;
},{}],27:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf");

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

module.exports = _inherits;
},{"./setPrototypeOf":33}],28:[function(require,module,exports){
function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

module.exports = _iterableToArray;
},{}],29:[function(require,module,exports){
function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;
},{}],30:[function(require,module,exports){
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

module.exports = _nonIterableRest;
},{}],31:[function(require,module,exports){
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

module.exports = _nonIterableSpread;
},{}],32:[function(require,module,exports){
var _typeof = require("../helpers/typeof");

var assertThisInitialized = require("./assertThisInitialized");

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;
},{"../helpers/typeof":36,"./assertThisInitialized":21}],33:[function(require,module,exports){
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
},{}],34:[function(require,module,exports){
var arrayWithHoles = require("./arrayWithHoles");

var iterableToArrayLimit = require("./iterableToArrayLimit");

var nonIterableRest = require("./nonIterableRest");

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;
},{"./arrayWithHoles":19,"./iterableToArrayLimit":29,"./nonIterableRest":30}],35:[function(require,module,exports){
var arrayWithoutHoles = require("./arrayWithoutHoles");

var iterableToArray = require("./iterableToArray");

var nonIterableSpread = require("./nonIterableSpread");

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;
},{"./arrayWithoutHoles":20,"./iterableToArray":28,"./nonIterableSpread":31}],36:[function(require,module,exports){
function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
},{}],37:[function(require,module,exports){
module.exports = require("regenerator-runtime");

},{"regenerator-runtime":44}],38:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = global.acorn || {}, global.acorn.walk = {})));
}(this, (function (exports) { 'use strict';

// AST walker module for Mozilla Parser API compatible trees

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be
//
//     walk.simple(myTree, {
//         Expression: function(node) { ... }
//     });
//
// to do something with all expressions. All Parser API node types
// can be used to identify node types, as well as Expression and
// Statement, which denote categories of nodes.
//
// The base argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.

function simple(node, visitors, baseVisitor, state, override) {
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    baseVisitor[type](node, st, c);
    if (found) { found(node, st); }
  })(node, state, override);
}

// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callback as third parameter
// (and also as state parameter when no other state is present).
function ancestor(node, visitors, baseVisitor, state) {
  var ancestors = [];
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type, found = visitors[type];
    var isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    baseVisitor[type](node, st, c);
    if (found) { found(node, st || ancestors, ancestors); }
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).
function recursive(node, state, funcs, baseVisitor, override) {
  var visitor = funcs ? make(funcs, baseVisitor || undefined) : baseVisitor;(function c(node, st, override) {
    visitor[override || node.type](node, st, c);
  })(node, state, override);
}

function makeTest(test) {
  if (typeof test === "string")
    { return function (type) { return type === test; } }
  else if (!test)
    { return function () { return true; } }
  else
    { return test }
}

var Found = function Found(node, state) { this.node = node; this.state = state; };

// A full walk triggers the callback on each node
function full(node, callback, baseVisitor, state, override) {
  if (!baseVisitor) { baseVisitor = base
  ; }(function c(node, st, override) {
    var type = override || node.type;
    baseVisitor[type](node, st, c);
    if (!override) { callback(node, st, type); }
  })(node, state, override);
}

// An fullAncestor walk is like an ancestor walk, but triggers
// the callback on each node
function fullAncestor(node, callback, baseVisitor, state) {
  if (!baseVisitor) { baseVisitor = base; }
  var ancestors = [];(function c(node, st, override) {
    var type = override || node.type;
    var isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) { ancestors.push(node); }
    baseVisitor[type](node, st, c);
    if (!override) { callback(node, st || ancestors, ancestors, type); }
    if (isNew) { ancestors.pop(); }
  })(node, state);
}

// Find a node with a given start, end, and type (all are optional,
// null can be used as wildcard). Returns a {node, state} object, or
// undefined when it doesn't find a matching node.
function findNodeAt(node, start, end, test, baseVisitor, state) {
  if (!baseVisitor) { baseVisitor = base; }
  test = makeTest(test);
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if ((start == null || node.start <= start) &&
          (end == null || node.end >= end))
        { baseVisitor[type](node, st, c); }
      if ((start == null || node.start === start) &&
          (end == null || node.end === end) &&
          test(type, node))
        { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the innermost node of a given type that contains the given
// position. Interface similar to findNodeAt.
function findNodeAround(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  try {
    (function c(node, st, override) {
      var type = override || node.type;
      if (node.start > pos || node.end < pos) { return }
      baseVisitor[type](node, st, c);
      if (test(type, node)) { throw new Found(node, st) }
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node after a given position.
function findNodeAfter(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  try {
    (function c(node, st, override) {
      if (node.end < pos) { return }
      var type = override || node.type;
      if (node.start >= pos && test(type, node)) { throw new Found(node, st) }
      baseVisitor[type](node, st, c);
    })(node, state);
  } catch (e) {
    if (e instanceof Found) { return e }
    throw e
  }
}

// Find the outermost matching node before a given position.
function findNodeBefore(node, pos, test, baseVisitor, state) {
  test = makeTest(test);
  if (!baseVisitor) { baseVisitor = base; }
  var max;(function c(node, st, override) {
    if (node.start > pos) { return }
    var type = override || node.type;
    if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
      { max = new Found(node, st); }
    baseVisitor[type](node, st, c);
  })(node, state);
  return max
}

// Fallback to an Object.create polyfill for older environments.
var create = Object.create || function(proto) {
  function Ctor() {}
  Ctor.prototype = proto;
  return new Ctor
};

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.
function make(funcs, baseVisitor) {
  var visitor = create(baseVisitor || base);
  for (var type in funcs) { visitor[type] = funcs[type]; }
  return visitor
}

function skipThrough(node, st, c) { c(node, st); }
function ignore(_node, _st, _c) {}

// Node walkers.

var base = {};

base.Program = base.BlockStatement = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var stmt = list[i];

    c(stmt, st, "Statement");
  }
};
base.Statement = skipThrough;
base.EmptyStatement = ignore;
base.ExpressionStatement = base.ParenthesizedExpression =
  function (node, st, c) { return c(node.expression, st, "Expression"); };
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Statement");
  if (node.alternate) { c(node.alternate, st, "Statement"); }
};
base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); };
base.BreakStatement = base.ContinueStatement = ignore;
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression");
  c(node.body, st, "Statement");
};
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression");
  for (var i = 0, list = node.cases; i < list.length; i += 1) {
    var cs = list[i];

    if (cs.test) { c(cs.test, st, "Expression"); }
    for (var i$1 = 0, list$1 = cs.consequent; i$1 < list$1.length; i$1 += 1)
      {
      var cons = list$1[i$1];

      c(cons, st, "Statement");
    }
  }
};
base.SwitchCase = function (node, st, c) {
  if (node.test) { c(node.test, st, "Expression"); }
  for (var i = 0, list = node.consequent; i < list.length; i += 1)
    {
    var cons = list[i];

    c(cons, st, "Statement");
  }
};
base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
  if (node.argument) { c(node.argument, st, "Expression"); }
};
base.ThrowStatement = base.SpreadElement =
  function (node, st, c) { return c(node.argument, st, "Expression"); };
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement");
  if (node.handler) { c(node.handler, st); }
  if (node.finalizer) { c(node.finalizer, st, "Statement"); }
};
base.CatchClause = function (node, st, c) {
  if (node.param) { c(node.param, st, "Pattern"); }
  c(node.body, st, "Statement");
};
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForStatement = function (node, st, c) {
  if (node.init) { c(node.init, st, "ForInit"); }
  if (node.test) { c(node.test, st, "Expression"); }
  if (node.update) { c(node.update, st, "Expression"); }
  c(node.body, st, "Statement");
};
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit");
  c(node.right, st, "Expression");
  c(node.body, st, "Statement");
};
base.ForInit = function (node, st, c) {
  if (node.type === "VariableDeclaration") { c(node, st); }
  else { c(node, st, "Expression"); }
};
base.DebuggerStatement = ignore;

base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); };
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0, list = node.declarations; i < list.length; i += 1)
    {
    var decl = list[i];

    c(decl, st);
  }
};
base.VariableDeclarator = function (node, st, c) {
  c(node.id, st, "Pattern");
  if (node.init) { c(node.init, st, "Expression"); }
};

base.Function = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    c(param, st, "Pattern");
  }
  c(node.body, st, node.expression ? "Expression" : "Statement");
};

base.Pattern = function (node, st, c) {
  if (node.type === "Identifier")
    { c(node, st, "VariablePattern"); }
  else if (node.type === "MemberExpression")
    { c(node, st, "MemberPattern"); }
  else
    { c(node, st); }
};
base.VariablePattern = ignore;
base.MemberPattern = skipThrough;
base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); };
base.ArrayPattern = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Pattern"); }
  }
};
base.ObjectPattern = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1) {
    var prop = list[i];

    if (prop.type === "Property") {
      if (prop.computed) { c(prop.key, st, "Expression"); }
      c(prop.value, st, "Pattern");
    } else if (prop.type === "RestElement") {
      c(prop.argument, st, "Pattern");
    }
  }
};

base.Expression = skipThrough;
base.ThisExpression = base.Super = base.MetaProperty = ignore;
base.ArrayExpression = function (node, st, c) {
  for (var i = 0, list = node.elements; i < list.length; i += 1) {
    var elt = list[i];

    if (elt) { c(elt, st, "Expression"); }
  }
};
base.ObjectExpression = function (node, st, c) {
  for (var i = 0, list = node.properties; i < list.length; i += 1)
    {
    var prop = list[i];

    c(prop, st);
  }
};
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
base.SequenceExpression = function (node, st, c) {
  for (var i = 0, list = node.expressions; i < list.length; i += 1)
    {
    var expr = list[i];

    c(expr, st, "Expression");
  }
};
base.TemplateLiteral = function (node, st, c) {
  for (var i = 0, list = node.quasis; i < list.length; i += 1)
    {
    var quasi = list[i];

    c(quasi, st);
  }

  for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1)
    {
    var expr = list$1[i$1];

    c(expr, st, "Expression");
  }
};
base.TemplateElement = ignore;
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression");
};
base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression");
  c(node.right, st, "Expression");
};
base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
  c(node.left, st, "Pattern");
  c(node.right, st, "Expression");
};
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression");
  c(node.consequent, st, "Expression");
  c(node.alternate, st, "Expression");
};
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression");
  if (node.arguments)
    { for (var i = 0, list = node.arguments; i < list.length; i += 1)
      {
        var arg = list[i];

        c(arg, st, "Expression");
      } }
};
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression");
  if (node.computed) { c(node.property, st, "Expression"); }
};
base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
  if (node.declaration)
    { c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression"); }
  if (node.source) { c(node.source, st, "Expression"); }
};
base.ExportAllDeclaration = function (node, st, c) {
  c(node.source, st, "Expression");
};
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0, list = node.specifiers; i < list.length; i += 1)
    {
    var spec = list[i];

    c(spec, st);
  }
  c(node.source, st, "Expression");
};
base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.Literal = ignore;

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression");
  c(node.quasi, st, "Expression");
};
base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); };
base.Class = function (node, st, c) {
  if (node.id) { c(node.id, st, "Pattern"); }
  if (node.superClass) { c(node.superClass, st, "Expression"); }
  c(node.body, st);
};
base.ClassBody = function (node, st, c) {
  for (var i = 0, list = node.body; i < list.length; i += 1)
    {
    var elt = list[i];

    c(elt, st);
  }
};
base.MethodDefinition = base.Property = function (node, st, c) {
  if (node.computed) { c(node.key, st, "Expression"); }
  c(node.value, st, "Expression");
};

exports.simple = simple;
exports.ancestor = ancestor;
exports.recursive = recursive;
exports.full = full;
exports.fullAncestor = fullAncestor;
exports.findNodeAt = findNodeAt;
exports.findNodeAround = findNodeAround;
exports.findNodeAfter = findNodeAfter;
exports.findNodeBefore = findNodeBefore;
exports.make = make;
exports.base = base;

Object.defineProperty(exports, '__esModule', { value: true });

})));


},{}],39:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = {})));
}(this, (function (exports) { 'use strict';

// Reserved word lists for various dialects of the language

var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " const class extends export import super"
};

var keywordRelationalOperator = /^in(stanceof)?$/;

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7b9\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by bin/generate-identifier-regex.js

// eslint-disable-next-line comma-spacing
var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,14,29,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,28,43,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,14,35,477,28,11,0,9,21,190,52,76,44,33,24,27,35,30,0,12,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,26,230,43,117,63,32,0,257,0,11,39,8,0,22,0,12,39,3,3,20,0,35,56,264,8,2,36,18,0,50,29,113,6,2,1,2,37,22,0,26,5,2,1,2,31,15,0,328,18,270,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,689,63,129,68,12,0,67,12,65,1,31,6129,15,754,9486,286,82,395,2309,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,15,7472,3104,541];

// eslint-disable-next-line comma-spacing
var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,574,3,9,9,525,10,176,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,6,1,45,0,13,2,49,13,9,3,4,9,83,11,7,0,161,11,6,9,7,3,56,1,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,5,0,82,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,243,14,166,9,280,9,41,6,2,3,9,0,10,10,47,15,406,7,2,7,17,9,57,21,2,13,123,5,4,0,2,1,2,6,2,0,9,9,49,4,2,1,2,4,9,9,330,3,19306,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) { return false }
    pos += set[i + 1];
    if (pos >= code) { return true }
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) { return code === 36 }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes)
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) { return code === 36 }
  if (code < 58) { return true }
  if (code < 65) { return false }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
}

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = function TokenType(label, conf) {
  if ( conf === void 0 ) conf = {};

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

function binop(name, prec) {
  return new TokenType(name, {beforeExpr: true, binop: prec})
}
var beforeExpr = {beforeExpr: true};
var startsExpr = {startsExpr: true};

// Map keyword names to token types.

var keywords$1 = {};

// Succinct definitions of keyword token types
function kw(name, options) {
  if ( options === void 0 ) options = {};

  options.keyword = name;
  return keywords$1[name] = new TokenType(name, options)
}

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
  prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", {beforeExpr: true}),

  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", {isLoop: true, beforeExpr: true}),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", {isLoop: true}),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", {isLoop: true}),
  _with: kw("with"),
  _new: kw("new", {beforeExpr: true, startsExpr: true}),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import"),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", {beforeExpr: true, binop: 7}),
  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
};

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");

function isNewLine(code, ecma2019String) {
  return code === 10 || code === 13 || (!ecma2019String && (code === 0x2028 || code === 0x2029))
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;

// Checks if an object has a property.

function has(obj, propName) {
  return hasOwnProperty.call(obj, propName)
}

var isArray = Array.isArray || (function (obj) { return (
  toString.call(obj) === "[object Array]"
); });

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  this.line = line;
  this.column = col;
};

Position.prototype.offset = function offset (n) {
  return new Position(this.line, this.column + n)
};

var SourceLocation = function SourceLocation(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) { this.source = p.sourceFile; }
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur;
    var match = lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur)
    }
  }
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must be
  // either 3, 5, 6 (2015), 7 (2016), 8 (2017), 9 (2018), or 10
  // (2019). This influences support for strict mode, the set of
  // reserved words, and support for new syntax features. The default
  // is 9.
  ecmaVersion: 9,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false
};

// Interpret and default an options object

function getOptions(opts) {
  var options = {};

  for (var opt in defaultOptions)
    { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

  if (options.ecmaVersion >= 2015)
    { options.ecmaVersion -= 2009; }

  if (options.allowReserved == null)
    { options.allowReserved = options.ecmaVersion < 5; }

  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function (token) { return tokens.push(token); };
  }
  if (isArray(options.onComment))
    { options.onComment = pushComment(options, options.onComment); }

  return options
}

function pushComment(options, array) {
  return function(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text,
      start: start,
      end: end
    };
    if (options.locations)
      { comment.loc = new SourceLocation(this, startLoc, endLoc); }
    if (options.ranges)
      { comment.range = [start, end]; }
    array.push(comment);
  }
}

// Each scope gets a bitset that may contain these flags
var SCOPE_TOP = 1;
var SCOPE_FUNCTION = 2;
var SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION;
var SCOPE_ASYNC = 4;
var SCOPE_GENERATOR = 8;
var SCOPE_ARROW = 16;
var SCOPE_SIMPLE_CATCH = 32;

function functionFlags(async, generator) {
  return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
}

// Used in checkLVal and declareName to determine the type of a binding
var BIND_NONE = 0;
var BIND_VAR = 1;
var BIND_LEXICAL = 2;
var BIND_FUNCTION = 3;
var BIND_SIMPLE_CATCH = 4;
var BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

function keywordRegexp(words) {
  return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
}

var Parser = function Parser(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5]);
  var reserved = "";
  if (!options.allowReserved) {
    for (var v = options.ecmaVersion;; v--)
      { if (reserved = reservedWords[v]) { break } }
    if (options.sourceType === "module") { reserved += " await"; }
  }
  this.reservedWords = keywordRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = keywordRegexp(reservedStrict);
  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  this.containsEsc = false;

  // Set up token state

  // The current position of the tokenizer in the input.
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }

  // Properties of the current token:
  // Its type
  this.type = types.eof;
  // For tokens that include more information than their type, the value
  this.value = null;
  // Its start and end offset
  this.start = this.end = this.pos;
  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  this.startLoc = this.endLoc = this.curPosition();

  // Position information for the previous token
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  this.context = this.initialContext();
  this.exprAllowed = true;

  // Figure out if it's a module code.
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);

  // Used to signify the start of a potential arrow function
  this.potentialArrowAt = -1;

  // Positions to delayed-check that yield/await does not exist in default parameters.
  this.yieldPos = this.awaitPos = 0;
  // Labels in scope.
  this.labels = [];

  // If enabled, skip leading hashbang line.
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
    { this.skipLineComment(2); }

  // Scope tracking for duplicate variable names (see scope.js)
  this.scopeStack = [];
  this.enterScope(SCOPE_TOP);

  // For RegExp validation
  this.regexpState = null;
};

var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true } };

Parser.prototype.parse = function parse () {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node)
};

prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };
prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };
prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };

Parser.extend = function extend () {
    var plugins = [], len = arguments.length;
    while ( len-- ) plugins[ len ] = arguments[ len ];

  var cls = this;
  for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
  return cls
};

Parser.parse = function parse (input, options) {
  return new this(options, input).parse()
};

Parser.parseExpressionAt = function parseExpressionAt (input, pos, options) {
  var parser = new this(options, input, pos);
  parser.nextToken();
  return parser.parseExpression()
};

Parser.tokenizer = function tokenizer (input, options) {
  return new this(options, input)
};

Object.defineProperties( Parser.prototype, prototypeAccessors );

var pp = Parser.prototype;

// ## Parser utilities

var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)"|;)/;
pp.strictDirective = function(start) {
  var this$1 = this;

  for (;;) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this$1.input)[0].length;
    var match = literal.exec(this$1.input.slice(start));
    if (!match) { return false }
    if ((match[1] || match[2]) === "use strict") { return true }
    start += match[0].length;
  }
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true
  } else {
    return false
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function(name) {
  return this.type === types.name && this.value === name && !this.containsEsc
};

// Consumes contextual keyword if possible.

pp.eatContextual = function(name) {
  if (!this.isContextual(name)) { return false }
  this.next();
  return true
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function(name) {
  if (!this.eatContextual(name)) { this.unexpected(); }
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function() {
  return this.type === types.eof ||
    this.type === types.braceR ||
    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

pp.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon)
      { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
    return true
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function() {
  if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
};

pp.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma)
      { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
    if (!notNext)
      { this.next(); }
    return true
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function(type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

function DestructuringErrors() {
  this.shorthandAssign =
  this.trailingComma =
  this.parenthesizedAssign =
  this.parenthesizedBind =
  this.doubleProto =
    -1;
}

pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) { return }
  if (refDestructuringErrors.trailingComma > -1)
    { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
};

pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) { return false }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
  if (shorthandAssign >= 0)
    { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
  if (doubleProto >= 0)
    { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
};

pp.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
    { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
  if (this.awaitPos)
    { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
};

pp.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression")
    { return this.isSimpleAssignTarget(expr.expression) }
  return expr.type === "Identifier" || expr.type === "MemberExpression"
};

var pp$1 = Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp$1.parseTopLevel = function(node) {
  var this$1 = this;

  var exports = {};
  if (!node.body) { node.body = []; }
  while (this.type !== types.eof) {
    var stmt = this$1.parseStatement(null, true, exports);
    node.body.push(stmt);
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program")
};

var loopLabel = {kind: "loop"};
var switchLabel = {kind: "switch"};

pp$1.isLet = function() {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh === 123) { return true } // '{' and '['
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
    var ident = this.input.slice(next, pos);
    if (!keywordRelationalOperator.test(ident)) { return true }
  }
  return false
};

// check 'async [no LineTerminator here] function'
// - 'async /*foo*/ function' is OK.
// - 'async /*\n*/ function' is invalid.
pp$1.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
    { return false }

  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  return !lineBreak.test(this.input.slice(this.pos, next)) &&
    this.input.slice(next, next + 8) === "function" &&
    (next + 8 === this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
};

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp$1.parseStatement = function(context, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind;

  if (this.isLet()) {
    starttype = types._var;
    kind = "let";
  }

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
  case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
  case types._debugger: return this.parseDebuggerStatement(node)
  case types._do: return this.parseDoStatement(node)
  case types._for: return this.parseForStatement(node)
  case types._function:
    if ((context && (this.strict || context !== "if")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
    return this.parseFunctionStatement(node, false, !context)
  case types._class:
    if (context) { this.unexpected(); }
    return this.parseClass(node, true)
  case types._if: return this.parseIfStatement(node)
  case types._return: return this.parseReturnStatement(node)
  case types._switch: return this.parseSwitchStatement(node)
  case types._throw: return this.parseThrowStatement(node)
  case types._try: return this.parseTryStatement(node)
  case types._const: case types._var:
    kind = kind || this.value;
    if (context && kind !== "var") { this.unexpected(); }
    return this.parseVarStatement(node, kind)
  case types._while: return this.parseWhileStatement(node)
  case types._with: return this.parseWithStatement(node)
  case types.braceL: return this.parseBlock(true, node)
  case types.semi: return this.parseEmptyStatement(node)
  case types._export:
  case types._import:
    if (!this.options.allowImportExportEverywhere) {
      if (!topLevel)
        { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
      if (!this.inModule)
        { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
    }
    return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
  default:
    if (this.isAsyncFunction()) {
      if (context) { this.unexpected(); }
      this.next();
      return this.parseFunctionStatement(node, true, !context)
    }

    var maybeName = this.value, expr = this.parseExpression();
    if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
      { return this.parseLabeledStatement(node, maybeName, expr, context) }
    else { return this.parseExpressionStatement(node, expr) }
  }
};

pp$1.parseBreakContinueStatement = function(node, keyword) {
  var this$1 = this;

  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
  else if (this.type !== types.name) { this.unexpected(); }
  else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this$1.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
      if (node.label && isBreak) { break }
    }
  }
  if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
};

pp$1.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement")
};

pp$1.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("do");
  this.labels.pop();
  this.expect(types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6)
    { this.eat(types.semi); }
  else
    { this.semicolon(); }
  return this.finishNode(node, "DoWhileStatement")
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp$1.parseForStatement = function(node) {
  this.next();
  var awaitAt = (this.options.ecmaVersion >= 9 && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction)) && this.eatContextual("await")) ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterScope(0);
  this.expect(types.parenL);
  if (this.type === types.semi) {
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, null)
  }
  var isLet = this.isLet();
  if (this.type === types._var || this.type === types._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
        !(kind !== "var" && init$1.declarations[0].init)) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      return this.parseForIn(node, init$1)
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init$1)
  }
  var refDestructuringErrors = new DestructuringErrors;
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (this.options.ecmaVersion >= 9) {
      if (this.type === types._in) {
        if (awaitAt > -1) { this.unexpected(awaitAt); }
      } else { node.await = awaitAt > -1; }
    }
    this.toAssignable(init, false, refDestructuringErrors);
    this.checkLVal(init);
    return this.parseForIn(node, init)
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) { this.unexpected(awaitAt); }
  return this.parseFor(node, init)
};

pp$1.parseFunctionStatement = function(node, isAsync, declarationPosition) {
  this.next();
  return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
};

pp$1.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  // allow function declarations in branches, but only in non-strict mode
  node.consequent = this.parseStatement("if");
  node.alternate = this.eat(types._else) ? this.parseStatement("if") : null;
  return this.finishNode(node, "IfStatement")
};

pp$1.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
    { this.raise(this.start, "'return' outside of function"); }
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
  else { node.argument = this.parseExpression(); this.semicolon(); }
  return this.finishNode(node, "ReturnStatement")
};

pp$1.parseSwitchStatement = function(node) {
  var this$1 = this;

  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types.braceL);
  this.labels.push(switchLabel);
  this.enterScope(0);

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  var cur;
  for (var sawDefault = false; this.type !== types.braceR;) {
    if (this$1.type === types._case || this$1.type === types._default) {
      var isCase = this$1.type === types._case;
      if (cur) { this$1.finishNode(cur, "SwitchCase"); }
      node.cases.push(cur = this$1.startNode());
      cur.consequent = [];
      this$1.next();
      if (isCase) {
        cur.test = this$1.parseExpression();
      } else {
        if (sawDefault) { this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses"); }
        sawDefault = true;
        cur.test = null;
      }
      this$1.expect(types.colon);
    } else {
      if (!cur) { this$1.unexpected(); }
      cur.consequent.push(this$1.parseStatement(null));
    }
  }
  this.exitScope();
  if (cur) { this.finishNode(cur, "SwitchCase"); }
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement")
};

pp$1.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
    { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement")
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp$1.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types.parenL)) {
      clause.param = this.parseBindingAtom();
      var simple = clause.param.type === "Identifier";
      this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
      this.checkLVal(clause.param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
      this.expect(types.parenR);
    } else {
      if (this.options.ecmaVersion < 10) { this.unexpected(); }
      clause.param = null;
      this.enterScope(0);
    }
    clause.body = this.parseBlock(false);
    this.exitScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer)
    { this.raise(node.start, "Missing catch or finally clause"); }
  return this.finishNode(node, "TryStatement")
};

pp$1.parseVarStatement = function(node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration")
};

pp$1.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("while");
  this.labels.pop();
  return this.finishNode(node, "WhileStatement")
};

pp$1.parseWithStatement = function(node) {
  if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement("with");
  return this.finishNode(node, "WithStatement")
};

pp$1.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement")
};

pp$1.parseLabeledStatement = function(node, maybeName, expr, context) {
  var this$1 = this;

  for (var i$1 = 0, list = this$1.labels; i$1 < list.length; i$1 += 1)
    {
    var label = list[i$1];

    if (label.name === maybeName)
      { this$1.raise(expr.start, "Label '" + maybeName + "' is already declared");
  } }
  var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this$1.labels[i];
    if (label$1.statementStart === node.start) {
      // Update information about previous labels on this node
      label$1.statementStart = this$1.start;
      label$1.kind = kind;
    } else { break }
  }
  this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
  node.body = this.parseStatement(context);
  if (node.body.type === "ClassDeclaration" ||
      node.body.type === "VariableDeclaration" && node.body.kind !== "var" ||
      node.body.type === "FunctionDeclaration" && (this.strict || node.body.generator || node.body.async))
    { this.raiseRecoverable(node.body.start, "Invalid labeled declaration"); }
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement")
};

pp$1.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement")
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp$1.parseBlock = function(createNewLexicalScope, node) {
  var this$1 = this;
  if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;
  if ( node === void 0 ) node = this.startNode();

  node.body = [];
  this.expect(types.braceL);
  if (createNewLexicalScope) { this.enterScope(0); }
  while (!this.eat(types.braceR)) {
    var stmt = this$1.parseStatement(null);
    node.body.push(stmt);
  }
  if (createNewLexicalScope) { this.exitScope(); }
  return this.finishNode(node, "BlockStatement")
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp$1.parseFor = function(node, init) {
  node.init = init;
  this.expect(types.semi);
  node.test = this.type === types.semi ? null : this.parseExpression();
  this.expect(types.semi);
  node.update = this.type === types.parenR ? null : this.parseExpression();
  this.expect(types.parenR);
  this.exitScope();
  node.body = this.parseStatement("for");
  this.labels.pop();
  return this.finishNode(node, "ForStatement")
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp$1.parseForIn = function(node, init) {
  var type = this.type === types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  if (type === "ForInStatement") {
    if (init.type === "AssignmentPattern" ||
      (init.type === "VariableDeclaration" && init.declarations[0].init != null &&
       (this.strict || init.declarations[0].id.type !== "Identifier")))
      { this.raise(init.start, "Invalid assignment in for-in loop head"); }
  }
  node.left = init;
  node.right = type === "ForInStatement" ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types.parenR);
  this.exitScope();
  node.body = this.parseStatement("for");
  this.labels.pop();
  return this.finishNode(node, type)
};

// Parse a list of variable declarations.

pp$1.parseVar = function(node, isFor, kind) {
  var this$1 = this;

  node.declarations = [];
  node.kind = kind;
  for (;;) {
    var decl = this$1.startNode();
    this$1.parseVarId(decl, kind);
    if (this$1.eat(types.eq)) {
      decl.init = this$1.parseMaybeAssign(isFor);
    } else if (kind === "const" && !(this$1.type === types._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
      this$1.unexpected();
    } else if (decl.id.type !== "Identifier" && !(isFor && (this$1.type === types._in || this$1.isContextual("of")))) {
      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"));
    if (!this$1.eat(types.comma)) { break }
  }
  return node
};

pp$1.parseVarId = function(decl, kind) {
  decl.id = this.parseBindingAtom(kind);
  this.checkLVal(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
};

var FUNC_STATEMENT = 1;
var FUNC_HANGING_STATEMENT = 2;
var FUNC_NULLABLE_ID = 4;

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseFunction = function(node, statement, allowExpressionBody, isAsync) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync)
    { node.generator = this.eat(types.star); }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  if (statement & FUNC_STATEMENT) {
    node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types.name ? null : this.parseIdent();
    if (node.id && !(statement & FUNC_HANGING_STATEMENT))
      { this.checkLVal(node.id, this.inModule && !this.inFunction ? BIND_LEXICAL : BIND_FUNCTION); }
  }

  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.enterScope(functionFlags(node.async, node.generator));

  if (!(statement & FUNC_STATEMENT))
    { node.id = this.type === types.name ? this.parseIdent() : null; }

  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);

  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
};

pp$1.parseFunctionParams = function(node) {
  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseClass = function(node, isStatement) {
  var this$1 = this;

  this.next();

  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    var element = this$1.parseClassElement();
    if (element) {
      classBody.body.push(element);
      if (element.type === "MethodDefinition" && element.kind === "constructor") {
        if (hadConstructor) { this$1.raise(element.start, "Duplicate constructor in the same class"); }
        hadConstructor = true;
      }
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
};

pp$1.parseClassElement = function() {
  var this$1 = this;

  if (this.eat(types.semi)) { return null }

  var method = this.startNode();
  var tryContextual = function (k, noLineBreak) {
    if ( noLineBreak === void 0 ) noLineBreak = false;

    var start = this$1.start, startLoc = this$1.startLoc;
    if (!this$1.eatContextual(k)) { return false }
    if (this$1.type !== types.parenL && (!noLineBreak || !this$1.canInsertSemicolon())) { return true }
    if (method.key) { this$1.unexpected(); }
    method.computed = false;
    method.key = this$1.startNodeAt(start, startLoc);
    method.key.name = k;
    this$1.finishNode(method.key, "Identifier");
    return false
  };

  method.kind = "method";
  method.static = tryContextual("static");
  var isGenerator = this.eat(types.star);
  var isAsync = false;
  if (!isGenerator) {
    if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    } else if (tryContextual("get")) {
      method.kind = "get";
    } else if (tryContextual("set")) {
      method.kind = "set";
    }
  }
  if (!method.key) { this.parsePropertyName(method); }
  var key = method.key;
  if (!method.computed && !method.static && (key.type === "Identifier" && key.name === "constructor" ||
      key.type === "Literal" && key.value === "constructor")) {
    if (method.kind !== "method") { this.raise(key.start, "Constructor can't have get/set modifier"); }
    if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
    if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
    method.kind = "constructor";
  } else if (method.static && key.type === "Identifier" && key.name === "prototype") {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  this.parseClassMethod(method, isGenerator, isAsync);
  if (method.kind === "get" && method.value.params.length !== 0)
    { this.raiseRecoverable(method.value.start, "getter should have no params"); }
  if (method.kind === "set" && method.value.params.length !== 1)
    { this.raiseRecoverable(method.value.start, "setter should have exactly one param"); }
  if (method.kind === "set" && method.value.params[0].type === "RestElement")
    { this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
  return method
};

pp$1.parseClassMethod = function(method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync);
  return this.finishNode(method, "MethodDefinition")
};

pp$1.parseClassId = function(node, isStatement) {
  node.id = this.type === types.name ? this.parseIdent() : isStatement === true ? this.unexpected() : null;
};

pp$1.parseClassSuper = function(node) {
  node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp$1.parseExport = function(node, exports) {
  var this$1 = this;

  this.next();
  // export * from '...'
  if (this.eat(types.star)) {
    this.expectContextual("from");
    if (this.type !== types.string) { this.unexpected(); }
    node.source = this.parseExprAtom();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(types._default)) { // export default ...
    this.checkExport(exports, "default", this.lastTokStart);
    var isAsync;
    if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      node.declaration = this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync, true);
    } else if (this.type === types._class) {
      var cNode = this.startNode();
      node.declaration = this.parseClass(cNode, "nullableID");
    } else {
      node.declaration = this.parseMaybeAssign();
      this.semicolon();
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(null);
    if (node.declaration.type === "VariableDeclaration")
      { this.checkVariableExport(exports, node.declaration.declarations); }
    else
      { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
    node.specifiers = [];
    node.source = null;
  } else { // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual("from")) {
      if (this.type !== types.string) { this.unexpected(); }
      node.source = this.parseExprAtom();
    } else {
      // check for keywords used as local names
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];

        this$1.checkUnreserved(spec.local);
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration")
};

pp$1.checkExport = function(exports, name, pos) {
  if (!exports) { return }
  if (has(exports, name))
    { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
  exports[name] = true;
};

pp$1.checkPatternExport = function(exports, pat) {
  var this$1 = this;

  var type = pat.type;
  if (type === "Identifier")
    { this.checkExport(exports, pat.name, pat.start); }
  else if (type === "ObjectPattern")
    { for (var i = 0, list = pat.properties; i < list.length; i += 1)
      {
        var prop = list[i];

        this$1.checkPatternExport(exports, prop);
      } }
  else if (type === "ArrayPattern")
    { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];

        if (elt) { this$1.checkPatternExport(exports, elt); }
    } }
  else if (type === "Property")
    { this.checkPatternExport(exports, pat.value); }
  else if (type === "AssignmentPattern")
    { this.checkPatternExport(exports, pat.left); }
  else if (type === "RestElement")
    { this.checkPatternExport(exports, pat.argument); }
  else if (type === "ParenthesizedExpression")
    { this.checkPatternExport(exports, pat.expression); }
};

pp$1.checkVariableExport = function(exports, decls) {
  var this$1 = this;

  if (!exports) { return }
  for (var i = 0, list = decls; i < list.length; i += 1)
    {
    var decl = list[i];

    this$1.checkPatternExport(exports, decl.id);
  }
};

pp$1.shouldParseExportStatement = function() {
  return this.type.keyword === "var" ||
    this.type.keyword === "const" ||
    this.type.keyword === "class" ||
    this.type.keyword === "function" ||
    this.isLet() ||
    this.isAsyncFunction()
};

// Parses a comma-separated list of module exports.

pp$1.parseExportSpecifiers = function(exports) {
  var this$1 = this;

  var nodes = [], first = true;
  // export { x, y as z } [from '...']
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node = this$1.startNode();
    node.local = this$1.parseIdent(true);
    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local;
    this$1.checkExport(exports, node.exported.name, node.exported.start);
    nodes.push(this$1.finishNode(node, "ExportSpecifier"));
  }
  return nodes
};

// Parses import declaration.

pp$1.parseImport = function(node) {
  this.next();
  // import '...'
  if (this.type === types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration")
};

// Parses a comma-separated list of module imports.

pp$1.parseImportSpecifiers = function() {
  var this$1 = this;

  var nodes = [], first = true;
  if (this.type === types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, BIND_LEXICAL);
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(types.comma)) { return nodes }
  }
  if (this.type === types.star) {
    var node$1 = this.startNode();
    this.next();
    this.expectContextual("as");
    node$1.local = this.parseIdent();
    this.checkLVal(node$1.local, BIND_LEXICAL);
    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
    return nodes
  }
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node$2 = this$1.startNode();
    node$2.imported = this$1.parseIdent(true);
    if (this$1.eatContextual("as")) {
      node$2.local = this$1.parseIdent();
    } else {
      this$1.checkUnreserved(node$2.imported);
      node$2.local = node$2.imported;
    }
    this$1.checkLVal(node$2.local, BIND_LEXICAL);
    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"));
  }
  return nodes
};

// Set `ExpressionStatement#directive` property for directive prologues.
pp$1.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$1.isDirectiveCandidate = function(statement) {
  return (
    statement.type === "ExpressionStatement" &&
    statement.expression.type === "Literal" &&
    typeof statement.expression.value === "string" &&
    // Reject parenthesized strings.
    (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
  )
};

var pp$2 = Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp$2.toAssignable = function(node, isBinding, refDestructuringErrors) {
  var this$1 = this;

  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
    case "Identifier":
      if (this.inAsync && node.name === "await")
        { this.raise(node.start, "Can not use 'await' as identifier inside an async function"); }
      break

    case "ObjectPattern":
    case "ArrayPattern":
    case "RestElement":
      break

    case "ObjectExpression":
      node.type = "ObjectPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      for (var i = 0, list = node.properties; i < list.length; i += 1) {
        var prop = list[i];

      this$1.toAssignable(prop, isBinding);
        // Early error:
        //   AssignmentRestProperty[Yield, Await] :
        //     `...` DestructuringAssignmentTarget[Yield, Await]
        //
        //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
        if (
          prop.type === "RestElement" &&
          (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
        ) {
          this$1.raise(prop.argument.start, "Unexpected token");
        }
      }
      break

    case "Property":
      // AssignmentProperty has type === "Property"
      if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
      this.toAssignable(node.value, isBinding);
      break

    case "ArrayExpression":
      node.type = "ArrayPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      this.toAssignableList(node.elements, isBinding);
      break

    case "SpreadElement":
      node.type = "RestElement";
      this.toAssignable(node.argument, isBinding);
      if (node.argument.type === "AssignmentPattern")
        { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
      break

    case "AssignmentExpression":
      if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
      node.type = "AssignmentPattern";
      delete node.operator;
      this.toAssignable(node.left, isBinding);
      // falls through to AssignmentPattern

    case "AssignmentPattern":
      break

    case "ParenthesizedExpression":
      this.toAssignable(node.expression, isBinding);
      break

    case "MemberExpression":
      if (!isBinding) { break }

    default:
      this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
  return node
};

// Convert list of expression atoms to binding list.

pp$2.toAssignableList = function(exprList, isBinding) {
  var this$1 = this;

  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) { this$1.toAssignable(elt, isBinding); }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
      { this.unexpected(last.argument.start); }
  }
  return exprList
};

// Parses spread element.

pp$2.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement")
};

pp$2.parseRestBinding = function() {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (this.options.ecmaVersion === 6 && this.type !== types.name)
    { this.unexpected(); }

  node.argument = this.parseBindingAtom();

  return this.finishNode(node, "RestElement")
};

// Parses lvalue (assignable) atom.

pp$2.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
    case types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern")

    case types.braceL:
      return this.parseObj(true)
    }
  }
  return this.parseIdent()
};

pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) { first = false; }
    else { this$1.expect(types.comma); }
    if (allowEmpty && this$1.type === types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
      break
    } else if (this$1.type === types.ellipsis) {
      var rest = this$1.parseRestBinding();
      this$1.parseBindingListItem(rest);
      elts.push(rest);
      if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
      this$1.expect(close);
      break
    } else {
      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc);
      this$1.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts
};

pp$2.parseBindingListItem = function(param) {
  return param
};

// Parses assignment pattern around given atom if possible.

pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern")
};

// Verify that a node is an lval — something that can be assigned
// to.
// bindingType can be either:
// 'var' indicating that the lval creates a 'var' binding
// 'let' indicating that the lval creates a lexical ('let' or 'const') binding
// 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

pp$2.checkLVal = function(expr, bindingType, checkClashes) {
  var this$1 = this;
  if ( bindingType === void 0 ) bindingType = BIND_NONE;

  switch (expr.type) {
  case "Identifier":
    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
      { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
    if (checkClashes) {
      if (has(checkClashes, expr.name))
        { this.raiseRecoverable(expr.start, "Argument name clash"); }
      checkClashes[expr.name] = true;
    }
    if (bindingType !== BIND_NONE && bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
    break

  case "MemberExpression":
    if (bindingType) { this.raiseRecoverable(expr.start, "Binding member expression"); }
    break

  case "ObjectPattern":
    for (var i = 0, list = expr.properties; i < list.length; i += 1)
      {
    var prop = list[i];

    this$1.checkLVal(prop, bindingType, checkClashes);
  }
    break

  case "Property":
    // AssignmentProperty has type === "Property"
    this.checkLVal(expr.value, bindingType, checkClashes);
    break

  case "ArrayPattern":
    for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
      var elem = list$1[i$1];

    if (elem) { this$1.checkLVal(elem, bindingType, checkClashes); }
    }
    break

  case "AssignmentPattern":
    this.checkLVal(expr.left, bindingType, checkClashes);
    break

  case "RestElement":
    this.checkLVal(expr.argument, bindingType, checkClashes);
    break

  case "ParenthesizedExpression":
    this.checkLVal(expr.expression, bindingType, checkClashes);
    break

  default:
    this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
  }
};

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

var pp$3 = Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp$3.checkPropClash = function(prop, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
    { return }
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
    { return }
  var key = prop.key;
  var name;
  switch (key.type) {
  case "Identifier": name = key.name; break
  case "Literal": name = String(key.value); break
  default: return
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors && refDestructuringErrors.doubleProto < 0) { refDestructuringErrors.doubleProto = key.start; }
        // Backwards-compat kludge. Can be removed in version 6.0
        else { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
      }
      propHash.proto = true;
    }
    return
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition)
      { this.raiseRecoverable(key.start, "Redefinition of property"); }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp$3.parseExpression = function(noIn, refDestructuringErrors) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types.comma)) { node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors)); }
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
  if (this.isContextual("yield")) {
    if (this.inGenerator) { return this.parseYield() }
    // The tokenizer will assume an expression is allowed after
    // `yield`, but this isn't that kind of yield
    else { this.exprAllowed = false; }
  }

  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldShorthandAssign = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    oldShorthandAssign = refDestructuringErrors.shorthandAssign;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.shorthandAssign = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors;
    ownDestructuringErrors = true;
  }

  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types.parenL || this.type === types.name)
    { this.potentialArrowAt = this.start; }
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === types.eq ? this.toAssignable(left, false, refDestructuringErrors) : left;
    if (!ownDestructuringErrors) { DestructuringErrors.call(refDestructuringErrors); }
    refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression")
  } else {
    if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
  }
  if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
  if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
  if (oldShorthandAssign > -1) { refDestructuringErrors.shorthandAssign = oldShorthandAssign; }
  return left
};

// Parse a ternary conditional (`?:`) operator.

pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  if (this.eat(types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
};

// Start the precedence parser.

pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== types._in)) {
    if (prec > minPrec) {
      var logical = this.type === types.logicalOR || this.type === types.logicalAND;
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
    }
  }
  return left
};

pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
};

// Parse unary operators, both prefix and postfix.

pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction))) {
    expr = this.parseAwait();
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) { this.checkLVal(node.argument); }
    else if (this.strict && node.operator === "delete" &&
             node.argument.type === "Identifier")
      { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
    else { sawUnary = true; }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.operator = this$1.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this$1.checkLVal(expr);
      this$1.next();
      expr = this$1.finishNode(node$1, "UpdateExpression");
    }
  }

  if (!sawUnary && this.eat(types.starstar))
    { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
  else
    { return expr }
};

// Parse call, dot, and `[]`-subscript expressions.

pp$3.parseExprSubscripts = function(refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) { return expr }
  var result = this.parseSubscripts(expr, startPos, startLoc);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
    if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
  }
  return result
};

pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
  var this$1 = this;

  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
      this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.input.slice(base.start, base.end) === "async";
  for (var computed = (void 0);;) {
    if ((computed = this$1.eat(types.bracketL)) || this$1.eat(types.dot)) {
      var node = this$1.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = computed ? this$1.parseExpression() : this$1.parseIdent(true);
      node.computed = !!computed;
      if (computed) { this$1.expect(types.bracketR); }
      base = this$1.finishNode(node, "MemberExpression");
    } else if (!noCalls && this$1.eat(types.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos;
      this$1.yieldPos = 0;
      this$1.awaitPos = 0;
      var exprList = this$1.parseExprList(types.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(types.arrow)) {
        this$1.checkPatternErrors(refDestructuringErrors, false);
        this$1.checkYieldAwaitInDefaultParams();
        this$1.yieldPos = oldYieldPos;
        this$1.awaitPos = oldAwaitPos;
        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
      }
      this$1.checkExpressionErrors(refDestructuringErrors, true);
      this$1.yieldPos = oldYieldPos || this$1.yieldPos;
      this$1.awaitPos = oldAwaitPos || this$1.awaitPos;
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      base = this$1.finishNode(node$1, "CallExpression");
    } else if (this$1.type === types.backQuote) {
      var node$2 = this$1.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this$1.parseTemplate({isTagged: true});
      base = this$1.finishNode(node$2, "TaggedTemplateExpression");
    } else {
      return base
    }
  }
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp$3.parseExprAtom = function(refDestructuringErrors) {
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
  case types._super:
    if (!this.inFunction)
      { this.raise(this.start, "'super' outside of function or class"); }
    node = this.startNode();
    this.next();
    // The `super` keyword can appear at below:
    // SuperProperty:
    //     super [ Expression ]
    //     super . IdentifierName
    // SuperCall:
    //     super Arguments
    if (this.type !== types.dot && this.type !== types.bracketL && this.type !== types.parenL)
      { this.unexpected(); }
    return this.finishNode(node, "Super")

  case types._this:
    node = this.startNode();
    this.next();
    return this.finishNode(node, "ThisExpression")

  case types.name:
    var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
    var id = this.parseIdent(this.type !== types.name);
    if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
      { return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true) }
    if (canBeArrow && !this.canInsertSemicolon()) {
      if (this.eat(types.arrow))
        { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name && !containsEsc) {
        id = this.parseIdent();
        if (this.canInsertSemicolon() || !this.eat(types.arrow))
          { this.unexpected(); }
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
      }
    }
    return id

  case types.regexp:
    var value = this.value;
    node = this.parseLiteral(value.value);
    node.regex = {pattern: value.pattern, flags: value.flags};
    return node

  case types.num: case types.string:
    return this.parseLiteral(this.value)

  case types._null: case types._true: case types._false:
    node = this.startNode();
    node.value = this.type === types._null ? null : this.type === types._true;
    node.raw = this.type.keyword;
    this.next();
    return this.finishNode(node, "Literal")

  case types.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        { refDestructuringErrors.parenthesizedAssign = start; }
      if (refDestructuringErrors.parenthesizedBind < 0)
        { refDestructuringErrors.parenthesizedBind = start; }
    }
    return expr

  case types.bracketL:
    node = this.startNode();
    this.next();
    node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
    return this.finishNode(node, "ArrayExpression")

  case types.braceL:
    return this.parseObj(false, refDestructuringErrors)

  case types._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, 0)

  case types._class:
    return this.parseClass(this.startNode(), false)

  case types._new:
    return this.parseNew()

  case types.backQuote:
    return this.parseTemplate()

  default:
    this.unexpected();
  }
};

pp$3.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal")
};

pp$3.parseParenExpression = function() {
  this.expect(types.parenL);
  var val = this.parseExpression();
  this.expect(types.parenR);
  return val
};

pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types.parenR) {
      first ? first = false : this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(types.parenR, true)) {
        lastIsComma = true;
        break
      } else if (this$1.type === types.ellipsis) {
        spreadStart = this$1.start;
        exprList.push(this$1.parseParenItem(this$1.parseRestBinding()));
        if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
        break
      } else {
        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem));
      }
    }
    var innerEndPos = this.start, innerEndLoc = this.startLoc;
    this.expect(types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList)
    }

    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
    if (spreadStart) { this.unexpected(spreadStart); }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
};

pp$3.parseParenItem = function(item) {
  return item
};

pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty$1 = [];

pp$3.parseNew = function() {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
    node.meta = meta;
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target" || containsEsc)
      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
    if (!this.inNonArrowFunction())
      { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false); }
  else { node.arguments = empty$1; }
  return this.finishNode(node, "NewExpression")
};

// Parse template expression.

pp$3.parseTemplateElement = function(ref) {
  var isTagged = ref.isTagged;

  var elem = this.startNode();
  if (this.type === types.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

pp$3.parseTemplate = function(ref) {
  var this$1 = this;
  if ( ref === void 0 ) ref = {};
  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({isTagged: isTagged});
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this$1.type === types.eof) { this$1.raise(this$1.pos, "Unterminated template literal"); }
    this$1.expect(types.dollarBraceL);
    node.expressions.push(this$1.parseExpression());
    this$1.expect(types.braceR);
    node.quasis.push(curElt = this$1.parseTemplateElement({isTagged: isTagged}));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral")
};

pp$3.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
    (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types.star)) &&
    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

// Parse an object literal or binding pattern.

pp$3.parseObj = function(isPattern, refDestructuringErrors) {
  var this$1 = this;

  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var prop = this$1.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) { this$1.checkPropClash(prop, propHash, refDestructuringErrors); }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
};

pp$3.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types.comma) {
        this.raise(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement")
    }
    // To disallow parenthesized identifier via `this.toAssignable()`.
    if (this.type === types.parenL && refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0) {
        refDestructuringErrors.parenthesizedAssign = this.start;
      }
      if (refDestructuringErrors.parenthesizedBind < 0) {
        refDestructuringErrors.parenthesizedBind = this.start;
      }
    }
    // Parse argument.
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    // To disallow trailing comma via `this.toAssignable()`.
    if (this.type === types.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    // Finish
    return this.finishNode(prop, "SpreadElement")
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern)
      { isGenerator = this.eat(types.star); }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    this.parsePropertyName(prop, refDestructuringErrors);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property")
};

pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types.colon)
    { this.unexpected(); }

  if (this.eat(types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
    if (isPattern) { this.unexpected(); }
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (!isPattern && !containsEsc &&
             this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type !== types.comma && this.type !== types.braceR)) {
    if (isGenerator || isAsync) { this.unexpected(); }
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    this.checkUnreserved(prop.key);
    prop.kind = "init";
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === types.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        { refDestructuringErrors.shorthandAssign = this.start; }
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else { this.unexpected(); }
};

pp$3.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types.bracketR);
      return prop.key
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(true)
};

// Initialize empty function node.

pp$3.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
  if (this.options.ecmaVersion >= 8) { node.async = false; }
};

// Parse object or class method.

pp$3.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos;

  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.yieldPos = 0;
  this.awaitPos = 0;
  this.enterScope(functionFlags(isAsync, node.generator));

  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false);

  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  return this.finishNode(node, "FunctionExpression")
};

// Parse arrow function expression with given parameters.

pp$3.parseArrowExpression = function(node, params, isAsync) {
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos;

  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

  this.yieldPos = 0;
  this.awaitPos = 0;

  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);

  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  return this.finishNode(node, "ArrowFunctionExpression")
};

// Parse function body and check parameters.

pp$3.parseFunctionBody = function(node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== types.braceL;
  var oldStrict = this.strict, useStrict = false;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) { this.strict = true; }

    // Add the params to varDeclaredNames to ensure that an error is thrown
    // if a let/const declaration in the function clashes with one of the params.
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && this.isSimpleParamList(node.params));
    node.body = this.parseBlock(false);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitScope();

  // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
  if (this.strict && node.id) { this.checkLVal(node.id, BIND_OUTSIDE); }
  this.strict = oldStrict;
};

pp$3.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1)
    {
    var param = list[i];

    if (param.type !== "Identifier") { return false
  } }
  return true
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$3.checkParams = function(node, allowDuplicates) {
  var this$1 = this;

  var nameHash = {};
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    this$1.checkLVal(param, BIND_VAR, allowDuplicates ? null : nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(close)) { break }
    } else { first = false; }

    var elt = (void 0);
    if (allowEmpty && this$1.type === types.comma)
      { elt = null; }
    else if (this$1.type === types.ellipsis) {
      elt = this$1.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this$1.type === types.comma && refDestructuringErrors.trailingComma < 0)
        { refDestructuringErrors.trailingComma = this$1.start; }
    } else {
      elt = this$1.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts
};

pp$3.checkUnreserved = function(ref) {
  var start = ref.start;
  var end = ref.end;
  var name = ref.name;

  if (this.inGenerator && name === "yield")
    { this.raiseRecoverable(start, "Can not use 'yield' as identifier inside a generator"); }
  if (this.inAsync && name === "await")
    { this.raiseRecoverable(start, "Can not use 'await' as identifier inside an async function"); }
  if (this.keywords.test(name))
    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
  if (this.options.ecmaVersion < 6 &&
    this.input.slice(start, end).indexOf("\\") !== -1) { return }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Can not use keyword 'await' outside an async function"); }
    this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
  }
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$3.parseIdent = function(liberal, isBinding) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved === "never") { liberal = false; }
  if (this.type === types.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;

    // To fix https://github.com/acornjs/acorn/issues/575
    // `class` and `function` keywords push new context into this.context.
    // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
    // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
    if ((node.name === "class" || node.name === "function") &&
        (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "Identifier");
  if (!liberal) { this.checkUnreserved(node); }
  return node
};

// Parses yield expression inside generator.

pp$3.parseYield = function() {
  if (!this.yieldPos) { this.yieldPos = this.start; }

  var node = this.startNode();
  this.next();
  if (this.type === types.semi || this.canInsertSemicolon() || (this.type !== types.star && !this.type.startsExpr)) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression")
};

pp$3.parseAwait = function() {
  if (!this.awaitPos) { this.awaitPos = this.start; }

  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true);
  return this.finishNode(node, "AwaitExpression")
};

var pp$4 = Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
  throw err
};

pp$4.raiseRecoverable = pp$4.raise;

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
};

var pp$5 = Parser.prototype;

var Scope = function Scope(flags) {
  this.flags = flags;
  // A list of var-declared names in the current lexical scope
  this.var = [];
  // A list of lexically-declared names in the current lexical scope
  this.lexical = [];
};

// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

pp$5.enterScope = function(flags) {
  this.scopeStack.push(new Scope(flags));
};

pp$5.exitScope = function() {
  this.scopeStack.pop();
};

pp$5.declareName = function(name, bindingType, pos) {
  var this$1 = this;

  var redeclared = false;
  if (bindingType === BIND_LEXICAL) {
    var scope = this.currentScope();
    redeclared = scope.lexical.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    scope.lexical.push(name);
  } else if (bindingType === BIND_SIMPLE_CATCH) {
    var scope$1 = this.currentScope();
    scope$1.lexical.push(name);
  } else if (bindingType === BIND_FUNCTION) {
    var scope$2 = this.currentScope();
    redeclared = scope$2.lexical.indexOf(name) > -1;
    scope$2.var.push(name);
  } else {
    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
      var scope$3 = this$1.scopeStack[i];
      if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) { redeclared = true; }
      scope$3.var.push(name);
      if (scope$3.flags & SCOPE_VAR) { break }
    }
  }
  if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
};

pp$5.currentScope = function() {
  return this.scopeStack[this.scopeStack.length - 1]
};

pp$5.currentVarScope = function() {
  var this$1 = this;

  for (var i = this.scopeStack.length - 1;; i--) {
    var scope = this$1.scopeStack[i];
    if (scope.flags & SCOPE_VAR) { return scope }
  }
};

pp$5.inNonArrowFunction = function() {
  var this$1 = this;

  for (var i = this.scopeStack.length - 1; i >= 0; i--)
    { if (this$1.scopeStack[i].flags & SCOPE_FUNCTION && !(this$1.scopeStack[i].flags & SCOPE_ARROW)) { return true } }
  return false
};

var Node = function Node(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations)
    { this.loc = new SourceLocation(parser, loc); }
  if (parser.options.directSourceFile)
    { this.sourceFile = parser.options.directSourceFile; }
  if (parser.options.ranges)
    { this.range = [pos, 0]; }
};

// Start an AST node, attaching a start offset.

var pp$6 = Parser.prototype;

pp$6.startNode = function() {
  return new Node(this, this.start, this.startLoc)
};

pp$6.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations)
    { node.loc.end = loc; }
  if (this.options.ranges)
    { node.range[1] = pos; }
  return node
}

pp$6.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
};

// Finish node at given position

pp$6.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
};

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};

var types$1 = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};

var pp$7 = Parser.prototype;

pp$7.initialContext = function() {
  return [types$1.b_stat]
};

pp$7.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types$1.f_expr || parent === types$1.f_stat)
    { return true }
  if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
    { return !parent.isExpr }

  // The check for `tt.name && exprAllowed` detects whether we are
  // after a `yield` or `of` construct. See the `updateContext` for
  // `tt.name`.
  if (prevType === types._return || prevType === types.name && this.exprAllowed)
    { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
  if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow)
    { return true }
  if (prevType === types.braceL)
    { return parent === types$1.b_stat }
  if (prevType === types._var || prevType === types.name)
    { return false }
  return !this.exprAllowed
};

pp$7.inGeneratorContext = function() {
  var this$1 = this;

  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this$1.context[i];
    if (context.token === "function")
      { return context.generator }
  }
  return false
};

pp$7.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType === types.dot)
    { this.exprAllowed = false; }
  else if (update = type.updateContext)
    { update.call(this, prevType); }
  else
    { this.exprAllowed = type.beforeExpr; }
};

// Token-specific context update code

types.parenR.updateContext = types.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return
  }
  var out = this.context.pop();
  if (out === types$1.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};

types.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
  this.exprAllowed = true;
};

types.dollarBraceL.updateContext = function() {
  this.context.push(types$1.b_tmpl);
  this.exprAllowed = true;
};

types.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
  this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
  this.exprAllowed = true;
};

types.incDec.updateContext = function() {
  // tokExprAllowed stays unchanged
};

types._function.updateContext = types._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
      !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
    { this.context.push(types$1.f_expr); }
  else
    { this.context.push(types$1.f_stat); }
  this.exprAllowed = false;
};

types.backQuote.updateContext = function() {
  if (this.curContext() === types$1.q_tmpl)
    { this.context.pop(); }
  else
    { this.context.push(types$1.q_tmpl); }
  this.exprAllowed = false;
};

types.star.updateContext = function(prevType) {
  if (prevType === types._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types$1.f_expr)
      { this.context[index] = types$1.f_expr_gen; }
    else
      { this.context[index] = types$1.f_gen; }
  }
  this.exprAllowed = true;
};

types.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6 && prevType !== types.dot) {
    if (this.value === "of" && !this.exprAllowed ||
        this.value === "yield" && this.inGeneratorContext())
      { allowed = true; }
  }
  this.exprAllowed = allowed;
};

var data = {
  "$LONE": [
    "ASCII",
    "ASCII_Hex_Digit",
    "AHex",
    "Alphabetic",
    "Alpha",
    "Any",
    "Assigned",
    "Bidi_Control",
    "Bidi_C",
    "Bidi_Mirrored",
    "Bidi_M",
    "Case_Ignorable",
    "CI",
    "Cased",
    "Changes_When_Casefolded",
    "CWCF",
    "Changes_When_Casemapped",
    "CWCM",
    "Changes_When_Lowercased",
    "CWL",
    "Changes_When_NFKC_Casefolded",
    "CWKCF",
    "Changes_When_Titlecased",
    "CWT",
    "Changes_When_Uppercased",
    "CWU",
    "Dash",
    "Default_Ignorable_Code_Point",
    "DI",
    "Deprecated",
    "Dep",
    "Diacritic",
    "Dia",
    "Emoji",
    "Emoji_Component",
    "Emoji_Modifier",
    "Emoji_Modifier_Base",
    "Emoji_Presentation",
    "Extender",
    "Ext",
    "Grapheme_Base",
    "Gr_Base",
    "Grapheme_Extend",
    "Gr_Ext",
    "Hex_Digit",
    "Hex",
    "IDS_Binary_Operator",
    "IDSB",
    "IDS_Trinary_Operator",
    "IDST",
    "ID_Continue",
    "IDC",
    "ID_Start",
    "IDS",
    "Ideographic",
    "Ideo",
    "Join_Control",
    "Join_C",
    "Logical_Order_Exception",
    "LOE",
    "Lowercase",
    "Lower",
    "Math",
    "Noncharacter_Code_Point",
    "NChar",
    "Pattern_Syntax",
    "Pat_Syn",
    "Pattern_White_Space",
    "Pat_WS",
    "Quotation_Mark",
    "QMark",
    "Radical",
    "Regional_Indicator",
    "RI",
    "Sentence_Terminal",
    "STerm",
    "Soft_Dotted",
    "SD",
    "Terminal_Punctuation",
    "Term",
    "Unified_Ideograph",
    "UIdeo",
    "Uppercase",
    "Upper",
    "Variation_Selector",
    "VS",
    "White_Space",
    "space",
    "XID_Continue",
    "XIDC",
    "XID_Start",
    "XIDS"
  ],
  "General_Category": [
    "Cased_Letter",
    "LC",
    "Close_Punctuation",
    "Pe",
    "Connector_Punctuation",
    "Pc",
    "Control",
    "Cc",
    "cntrl",
    "Currency_Symbol",
    "Sc",
    "Dash_Punctuation",
    "Pd",
    "Decimal_Number",
    "Nd",
    "digit",
    "Enclosing_Mark",
    "Me",
    "Final_Punctuation",
    "Pf",
    "Format",
    "Cf",
    "Initial_Punctuation",
    "Pi",
    "Letter",
    "L",
    "Letter_Number",
    "Nl",
    "Line_Separator",
    "Zl",
    "Lowercase_Letter",
    "Ll",
    "Mark",
    "M",
    "Combining_Mark",
    "Math_Symbol",
    "Sm",
    "Modifier_Letter",
    "Lm",
    "Modifier_Symbol",
    "Sk",
    "Nonspacing_Mark",
    "Mn",
    "Number",
    "N",
    "Open_Punctuation",
    "Ps",
    "Other",
    "C",
    "Other_Letter",
    "Lo",
    "Other_Number",
    "No",
    "Other_Punctuation",
    "Po",
    "Other_Symbol",
    "So",
    "Paragraph_Separator",
    "Zp",
    "Private_Use",
    "Co",
    "Punctuation",
    "P",
    "punct",
    "Separator",
    "Z",
    "Space_Separator",
    "Zs",
    "Spacing_Mark",
    "Mc",
    "Surrogate",
    "Cs",
    "Symbol",
    "S",
    "Titlecase_Letter",
    "Lt",
    "Unassigned",
    "Cn",
    "Uppercase_Letter",
    "Lu"
  ],
  "Script": [
    "Adlam",
    "Adlm",
    "Ahom",
    "Anatolian_Hieroglyphs",
    "Hluw",
    "Arabic",
    "Arab",
    "Armenian",
    "Armn",
    "Avestan",
    "Avst",
    "Balinese",
    "Bali",
    "Bamum",
    "Bamu",
    "Bassa_Vah",
    "Bass",
    "Batak",
    "Batk",
    "Bengali",
    "Beng",
    "Bhaiksuki",
    "Bhks",
    "Bopomofo",
    "Bopo",
    "Brahmi",
    "Brah",
    "Braille",
    "Brai",
    "Buginese",
    "Bugi",
    "Buhid",
    "Buhd",
    "Canadian_Aboriginal",
    "Cans",
    "Carian",
    "Cari",
    "Caucasian_Albanian",
    "Aghb",
    "Chakma",
    "Cakm",
    "Cham",
    "Cherokee",
    "Cher",
    "Common",
    "Zyyy",
    "Coptic",
    "Copt",
    "Qaac",
    "Cuneiform",
    "Xsux",
    "Cypriot",
    "Cprt",
    "Cyrillic",
    "Cyrl",
    "Deseret",
    "Dsrt",
    "Devanagari",
    "Deva",
    "Duployan",
    "Dupl",
    "Egyptian_Hieroglyphs",
    "Egyp",
    "Elbasan",
    "Elba",
    "Ethiopic",
    "Ethi",
    "Georgian",
    "Geor",
    "Glagolitic",
    "Glag",
    "Gothic",
    "Goth",
    "Grantha",
    "Gran",
    "Greek",
    "Grek",
    "Gujarati",
    "Gujr",
    "Gurmukhi",
    "Guru",
    "Han",
    "Hani",
    "Hangul",
    "Hang",
    "Hanunoo",
    "Hano",
    "Hatran",
    "Hatr",
    "Hebrew",
    "Hebr",
    "Hiragana",
    "Hira",
    "Imperial_Aramaic",
    "Armi",
    "Inherited",
    "Zinh",
    "Qaai",
    "Inscriptional_Pahlavi",
    "Phli",
    "Inscriptional_Parthian",
    "Prti",
    "Javanese",
    "Java",
    "Kaithi",
    "Kthi",
    "Kannada",
    "Knda",
    "Katakana",
    "Kana",
    "Kayah_Li",
    "Kali",
    "Kharoshthi",
    "Khar",
    "Khmer",
    "Khmr",
    "Khojki",
    "Khoj",
    "Khudawadi",
    "Sind",
    "Lao",
    "Laoo",
    "Latin",
    "Latn",
    "Lepcha",
    "Lepc",
    "Limbu",
    "Limb",
    "Linear_A",
    "Lina",
    "Linear_B",
    "Linb",
    "Lisu",
    "Lycian",
    "Lyci",
    "Lydian",
    "Lydi",
    "Mahajani",
    "Mahj",
    "Malayalam",
    "Mlym",
    "Mandaic",
    "Mand",
    "Manichaean",
    "Mani",
    "Marchen",
    "Marc",
    "Masaram_Gondi",
    "Gonm",
    "Meetei_Mayek",
    "Mtei",
    "Mende_Kikakui",
    "Mend",
    "Meroitic_Cursive",
    "Merc",
    "Meroitic_Hieroglyphs",
    "Mero",
    "Miao",
    "Plrd",
    "Modi",
    "Mongolian",
    "Mong",
    "Mro",
    "Mroo",
    "Multani",
    "Mult",
    "Myanmar",
    "Mymr",
    "Nabataean",
    "Nbat",
    "New_Tai_Lue",
    "Talu",
    "Newa",
    "Nko",
    "Nkoo",
    "Nushu",
    "Nshu",
    "Ogham",
    "Ogam",
    "Ol_Chiki",
    "Olck",
    "Old_Hungarian",
    "Hung",
    "Old_Italic",
    "Ital",
    "Old_North_Arabian",
    "Narb",
    "Old_Permic",
    "Perm",
    "Old_Persian",
    "Xpeo",
    "Old_South_Arabian",
    "Sarb",
    "Old_Turkic",
    "Orkh",
    "Oriya",
    "Orya",
    "Osage",
    "Osge",
    "Osmanya",
    "Osma",
    "Pahawh_Hmong",
    "Hmng",
    "Palmyrene",
    "Palm",
    "Pau_Cin_Hau",
    "Pauc",
    "Phags_Pa",
    "Phag",
    "Phoenician",
    "Phnx",
    "Psalter_Pahlavi",
    "Phlp",
    "Rejang",
    "Rjng",
    "Runic",
    "Runr",
    "Samaritan",
    "Samr",
    "Saurashtra",
    "Saur",
    "Sharada",
    "Shrd",
    "Shavian",
    "Shaw",
    "Siddham",
    "Sidd",
    "SignWriting",
    "Sgnw",
    "Sinhala",
    "Sinh",
    "Sora_Sompeng",
    "Sora",
    "Soyombo",
    "Soyo",
    "Sundanese",
    "Sund",
    "Syloti_Nagri",
    "Sylo",
    "Syriac",
    "Syrc",
    "Tagalog",
    "Tglg",
    "Tagbanwa",
    "Tagb",
    "Tai_Le",
    "Tale",
    "Tai_Tham",
    "Lana",
    "Tai_Viet",
    "Tavt",
    "Takri",
    "Takr",
    "Tamil",
    "Taml",
    "Tangut",
    "Tang",
    "Telugu",
    "Telu",
    "Thaana",
    "Thaa",
    "Thai",
    "Tibetan",
    "Tibt",
    "Tifinagh",
    "Tfng",
    "Tirhuta",
    "Tirh",
    "Ugaritic",
    "Ugar",
    "Vai",
    "Vaii",
    "Warang_Citi",
    "Wara",
    "Yi",
    "Yiii",
    "Zanabazar_Square",
    "Zanb"
  ]
};
Array.prototype.push.apply(data.$LONE, data.General_Category);
data.gc = data.General_Category;
data.sc = data.Script_Extensions = data.scx = data.Script;

var pp$9 = Parser.prototype;

var RegExpValidationState = function RegExpValidationState(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "");
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = [];
  this.backReferenceNames = [];
};

RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
  this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
};

RegExpValidationState.prototype.raise = function raise (message) {
  this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
};

// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
RegExpValidationState.prototype.at = function at (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return c
  }
  return (c << 10) + s.charCodeAt(i + 1) - 0x35FDC00
};

RegExpValidationState.prototype.nextIndex = function nextIndex (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return i + 1
  }
  return i + 2
};

RegExpValidationState.prototype.current = function current () {
  return this.at(this.pos)
};

RegExpValidationState.prototype.lookahead = function lookahead () {
  return this.at(this.nextIndex(this.pos))
};

RegExpValidationState.prototype.advance = function advance () {
  this.pos = this.nextIndex(this.pos);
};

RegExpValidationState.prototype.eat = function eat (ch) {
  if (this.current() === ch) {
    this.advance();
    return true
  }
  return false
};

function codePointToString$1(ch) {
  if (ch <= 0xFFFF) { return String.fromCharCode(ch) }
  ch -= 0x10000;
  return String.fromCharCode((ch >> 10) + 0xD800, (ch & 0x03FF) + 0xDC00)
}

/**
 * Validate the flags part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpFlags = function(state) {
  var this$1 = this;

  var validFlags = state.validFlags;
  var flags = state.flags;

  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this$1.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this$1.raise(state.start, "Duplicate regular expression flag");
    }
  }
};

/**
 * Validate the pattern part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);

  // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
  // parsing contains a |GroupName|, reparse with the goal symbol
  // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
  // exception if _P_ did not conform to the grammar, if any elements of _P_
  // were not matched by the parse, or if any Early Error conditions exist.
  if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
pp$9.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames.length = 0;
  state.backReferenceNames.length = 0;

  this.regexp_disjunction(state);

  if (state.pos !== state.source.length) {
    // Make the same messages as V8.
    if (state.eat(0x29 /* ) */)) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(0x5D /* [ */) || state.eat(0x7D /* } */)) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];

    if (state.groupNames.indexOf(name) === -1) {
      state.raise("Invalid named capture referenced");
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
pp$9.regexp_disjunction = function(state) {
  var this$1 = this;

  this.regexp_alternative(state);
  while (state.eat(0x7C /* | */)) {
    this$1.regexp_alternative(state);
  }

  // Make the same message as V8.
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(0x7B /* { */)) {
    state.raise("Lone quantifier brackets");
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
pp$9.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state))
    {  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
pp$9.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    // Handle `QuantifiableAssertion Quantifier` alternative.
    // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
    // is a QuantifiableAssertion.
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      // Make the same message as V8.
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true
  }

  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
pp$9.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;

  // ^, $
  if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
    return true
  }

  // \b \B
  if (state.eat(0x5C /* \ */)) {
    if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
      return true
    }
    state.pos = start;
  }

  // Lookahead / Lookbehind
  if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(0x3C /* < */);
    }
    if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
      this.regexp_disjunction(state);
      if (!state.eat(0x29 /* ) */)) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true
    }
  }

  state.pos = start;
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
pp$9.regexp_eatQuantifier = function(state, noError) {
  if ( noError === void 0 ) noError = false;

  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(0x3F /* ? */);
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
pp$9.regexp_eatQuantifierPrefix = function(state, noError) {
  return (
    state.eat(0x2A /* * */) ||
    state.eat(0x2B /* + */) ||
    state.eat(0x3F /* ? */) ||
    this.regexp_eatBracedQuantifier(state, noError)
  )
};
pp$9.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(0x7B /* { */)) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(0x7D /* } */)) {
        // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
pp$9.regexp_eatAtom = function(state) {
  return (
    this.regexp_eatPatternCharacters(state) ||
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state)
  )
};
pp$9.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatAtomEscape(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(0x28 /* ( */)) {
    if (state.eat(0x3F /* ? */) && state.eat(0x3A /* : */)) {
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        return true
      }
      state.raise("Unterminated group");
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatCapturingGroup = function(state) {
  if (state.eat(0x28 /* ( */)) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 0x3F /* ? */) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(0x29 /* ) */)) {
      state.numCapturingParens += 1;
      return true
    }
    state.raise("Unterminated group");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
pp$9.regexp_eatExtendedAtom = function(state) {
  return (
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state) ||
    this.regexp_eatInvalidBracedQuantifier(state) ||
    this.regexp_eatExtendedPatternCharacter(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
pp$9.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
pp$9.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }
  return false
};
function isSyntaxCharacter(ch) {
  return (
    ch === 0x24 /* $ */ ||
    ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
    ch === 0x2E /* . */ ||
    ch === 0x3F /* ? */ ||
    ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
// But eat eager.
pp$9.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
pp$9.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (
    ch !== -1 &&
    ch !== 0x24 /* $ */ &&
    !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
    ch !== 0x2E /* . */ &&
    ch !== 0x3F /* ? */ &&
    ch !== 0x5B /* [ */ &&
    ch !== 0x5E /* ^ */ &&
    ch !== 0x7C /* | */
  ) {
    state.advance();
    return true
  }
  return false
};

// GroupSpecifier[U] ::
//   [empty]
//   `?` GroupName[?U]
pp$9.regexp_groupSpecifier = function(state) {
  if (state.eat(0x3F /* ? */)) {
    if (this.regexp_eatGroupName(state)) {
      if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
        state.raise("Duplicate capture group name");
      }
      state.groupNames.push(state.lastStringValue);
      return
    }
    state.raise("Invalid group");
  }
};

// GroupName[U] ::
//   `<` RegExpIdentifierName[?U] `>`
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(0x3C /* < */)) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
      return true
    }
    state.raise("Invalid capture group name");
  }
  return false
};

// RegExpIdentifierName[U] ::
//   RegExpIdentifierStart[?U]
//   RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString$1(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString$1(state.lastIntValue);
    }
    return true
  }
  return false
};

// RegExpIdentifierStart[U] ::
//   UnicodeIDStart
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
pp$9.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
}

// RegExpIdentifierPart[U] ::
//   UnicodeIDContinue
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
//   <ZWNJ>
//   <ZWJ>
pp$9.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
pp$9.regexp_eatAtomEscape = function(state) {
  if (
    this.regexp_eatBackReference(state) ||
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state) ||
    (state.switchN && this.regexp_eatKGroupName(state))
  ) {
    return true
  }
  if (state.switchU) {
    // Make the same message as V8.
    if (state.current() === 0x63 /* c */) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false
};
pp$9.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true
    }
    if (n <= state.numCapturingParens) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatKGroupName = function(state) {
  if (state.eat(0x6B /* k */)) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true
    }
    state.raise("Invalid named reference");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
pp$9.regexp_eatCharacterEscape = function(state) {
  return (
    this.regexp_eatControlEscape(state) ||
    this.regexp_eatCControlLetter(state) ||
    this.regexp_eatZero(state) ||
    this.regexp_eatHexEscapeSequence(state) ||
    this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
    (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
    this.regexp_eatIdentityEscape(state)
  )
};
pp$9.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(0x63 /* c */)) {
    if (this.regexp_eatControlLetter(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatZero = function(state) {
  if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
pp$9.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 0x74 /* t */) {
    state.lastIntValue = 0x09; /* \t */
    state.advance();
    return true
  }
  if (ch === 0x6E /* n */) {
    state.lastIntValue = 0x0A; /* \n */
    state.advance();
    return true
  }
  if (ch === 0x76 /* v */) {
    state.lastIntValue = 0x0B; /* \v */
    state.advance();
    return true
  }
  if (ch === 0x66 /* f */) {
    state.lastIntValue = 0x0C; /* \f */
    state.advance();
    return true
  }
  if (ch === 0x72 /* r */) {
    state.lastIntValue = 0x0D; /* \r */
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
pp$9.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};
function isControlLetter(ch) {
  return (
    (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
    (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
pp$9.regexp_eatRegExpUnicodeEscapeSequence = function(state) {
  var start = state.pos;

  if (state.eat(0x75 /* u */)) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (state.switchU && lead >= 0xD800 && lead <= 0xDBFF) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 0xDC00 && trail <= 0xDFFF) {
            state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
            return true
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true
    }
    if (
      state.switchU &&
      state.eat(0x7B /* { */) &&
      this.regexp_eatHexDigits(state) &&
      state.eat(0x7D /* } */) &&
      isValidUnicode(state.lastIntValue)
    ) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }

  return false
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 0x10FFFF
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
pp$9.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true
    }
    if (state.eat(0x2F /* / */)) {
      state.lastIntValue = 0x2F; /* / */
      return true
    }
    return false
  }

  var ch = state.current();
  if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
pp$9.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
pp$9.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();

  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return true
  }

  if (
    state.switchU &&
    this.options.ecmaVersion >= 9 &&
    (ch === 0x50 /* P */ || ch === 0x70 /* p */)
  ) {
    state.lastIntValue = -1;
    state.advance();
    if (
      state.eat(0x7B /* { */) &&
      this.regexp_eatUnicodePropertyValueExpression(state) &&
      state.eat(0x7D /* } */)
    ) {
      return true
    }
    state.raise("Invalid property name");
  }

  return false
};
function isCharacterClassEscape(ch) {
  return (
    ch === 0x64 /* d */ ||
    ch === 0x44 /* D */ ||
    ch === 0x73 /* s */ ||
    ch === 0x53 /* S */ ||
    ch === 0x77 /* w */ ||
    ch === 0x57 /* W */
  )
}

// UnicodePropertyValueExpression ::
//   UnicodePropertyName `=` UnicodePropertyValue
//   LoneUnicodePropertyNameOrValue
pp$9.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;

  // UnicodePropertyName `=` UnicodePropertyValue
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return true
    }
  }
  state.pos = start;

  // LoneUnicodePropertyNameOrValue
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
    return true
  }
  return false
};
pp$9.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!data.hasOwnProperty(name) || data[name].indexOf(value) === -1) {
    state.raise("Invalid property name");
  }
};
pp$9.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (data.$LONE.indexOf(nameOrValue) === -1) {
    state.raise("Invalid property name");
  }
};

// UnicodePropertyName ::
//   UnicodePropertyNameCharacters
pp$9.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 0x5F /* _ */
}

// UnicodePropertyValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
}

// LoneUnicodePropertyNameOrValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state)
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
pp$9.regexp_eatCharacterClass = function(state) {
  if (state.eat(0x5B /* [ */)) {
    state.eat(0x5E /* ^ */);
    this.regexp_classRanges(state);
    if (state.eat(0x5D /* [ */)) {
      return true
    }
    // Unreachable since it threw "unterminated regular expression" error before.
    state.raise("Unterminated character class");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
pp$9.regexp_classRanges = function(state) {
  var this$1 = this;

  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(0x2D /* - */) && this$1.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
pp$9.regexp_eatClassAtom = function(state) {
  var start = state.pos;

  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatClassEscape(state)) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      var ch$1 = state.current();
      if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }

  var ch = state.current();
  if (ch !== 0x5D /* [ */) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
pp$9.regexp_eatClassEscape = function(state) {
  var start = state.pos;

  if (state.eat(0x62 /* b */)) {
    state.lastIntValue = 0x08; /* <BS> */
    return true
  }

  if (state.switchU && state.eat(0x2D /* - */)) {
    state.lastIntValue = 0x2D; /* - */
    return true
  }

  if (!state.switchU && state.eat(0x63 /* c */)) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true
    }
    state.pos = start;
  }

  return (
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
pp$9.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(0x78 /* x */)) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
pp$9.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
    state.advance();
  }
  return state.pos !== start
};
function isDecimalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
pp$9.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start
};
function isHexDigit(ch) {
  return (
    (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
    (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
    (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
  )
}
function hexToInt(ch) {
  if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
    return 10 + (ch - 0x41 /* A */)
  }
  if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
    return 10 + (ch - 0x61 /* a */)
  }
  return ch - 0x30 /* 0 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
// Allows only 0-377(octal) i.e. 0-255(decimal).
pp$9.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
pp$9.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 0x30; /* 0 */
    state.advance();
    return true
  }
  state.lastIntValue = 0;
  return false
};
function isOctalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true
};

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations)
    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
  if (p.options.ranges)
    { this.range = [p.start, p.end]; }
};

// ## Tokenizer

var pp$8 = Parser.prototype;

// Move to the next token

pp$8.next = function() {
  if (this.options.onToken)
    { this.options.onToken(new Token(this)); }

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp$8.getToken = function() {
  this.next();
  return new Token(this)
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  { pp$8[Symbol.iterator] = function() {
    var this$1 = this;

    return {
      next: function () {
        var token = this$1.getToken();
        return {
          done: token.type === types.eof,
          value: token
        }
      }
    }
  }; }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp$8.curContext = function() {
  return this.context[this.context.length - 1]
};

// Read a single token, updating the parser object's token-related
// properties.

pp$8.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

  this.start = this.pos;
  if (this.options.locations) { this.startLoc = this.curPosition(); }
  if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

  if (curContext.override) { return curContext.override(this) }
  else { this.readToken(this.fullCharCodeAtPos()); }
};

pp$8.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    { return this.readWord() }

  return this.getTokenFromCode(code)
};

pp$8.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) { return code }
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00
};

pp$8.skipBlockComment = function() {
  var this$1 = this;

  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
  this.pos = end + 2;
  if (this.options.locations) {
    lineBreakG.lastIndex = start;
    var match;
    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this$1.curLine;
      this$1.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment)
    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition()); }
};

pp$8.skipLineComment = function(startSkip) {
  var this$1 = this;

  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this$1.input.charCodeAt(++this$1.pos);
  }
  if (this.options.onComment)
    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition()); }
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp$8.skipSpace = function() {
  var this$1 = this;

  loop: while (this.pos < this.input.length) {
    var ch = this$1.input.charCodeAt(this$1.pos);
    switch (ch) {
    case 32: case 160: // ' '
      ++this$1.pos;
      break
    case 13:
      if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
        ++this$1.pos;
      }
    case 10: case 8232: case 8233:
      ++this$1.pos;
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      break
    case 47: // '/'
      switch (this$1.input.charCodeAt(this$1.pos + 1)) {
      case 42: // '*'
        this$1.skipBlockComment();
        break
      case 47:
        this$1.skipLineComment(2);
        break
      default:
        break loop
      }
      break
    default:
      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this$1.pos;
      } else {
        break loop
      }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp$8.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) { this.endLoc = this.curPosition(); }
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp$8.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) { return this.readNumber(true) }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(types.ellipsis)
  } else {
    ++this.pos;
    return this.finishToken(types.dot)
  }
};

pp$8.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.slash, 1)
};

pp$8.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types.star : types.modulo;

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }

  if (next === 61) { return this.finishOp(types.assign, size + 1) }
  return this.finishOp(tokentype, size)
};

pp$8.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
};

pp$8.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.bitwiseXOR, 1)
};

pp$8.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken()
    }
    return this.finishOp(types.incDec, 2)
  }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.plusMin, 1)
};

pp$8.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
    return this.finishOp(types.bitShift, size)
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
      this.input.charCodeAt(this.pos + 3) === 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken()
  }
  if (next === 61) { size = 2; }
  return this.finishOp(types.relational, size)
};

pp$8.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2;
    return this.finishToken(types.arrow)
  }
  return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
};

pp$8.getTokenFromCode = function(code) {
  switch (code) {
  // The interpretation of a dot depends on whether it is followed
  // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

  // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(types.parenL)
  case 41: ++this.pos; return this.finishToken(types.parenR)
  case 59: ++this.pos; return this.finishToken(types.semi)
  case 44: ++this.pos; return this.finishToken(types.comma)
  case 91: ++this.pos; return this.finishToken(types.bracketL)
  case 93: ++this.pos; return this.finishToken(types.bracketR)
  case 123: ++this.pos; return this.finishToken(types.braceL)
  case 125: ++this.pos; return this.finishToken(types.braceR)
  case 58: ++this.pos; return this.finishToken(types.colon)
  case 63: ++this.pos; return this.finishToken(types.question)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) { break }
    ++this.pos;
    return this.finishToken(types.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
    }

  // Anything else beginning with a digit is an integer, octal
  // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

  // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

  // Operators are parsed inline in tiny state machines. '=' (61) is
  // often referred to. `finishOp` simply skips the amount of
  // characters it is given as second argument, and returns a token
  // of the type given by its first argument.

  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 126: // '~'
    return this.finishOp(types.prefix, 1)
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp$8.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str)
};

pp$8.readRegexp = function() {
  var this$1 = this;

  var escaped, inClass, start = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(start, "Unterminated regular expression"); }
    var ch = this$1.input.charAt(this$1.pos);
    if (lineBreak.test(ch)) { this$1.raise(start, "Unterminated regular expression"); }
    if (!escaped) {
      if (ch === "[") { inClass = true; }
      else if (ch === "]" && inClass) { inClass = false; }
      else if (ch === "/" && !inClass) { break }
      escaped = ch === "\\";
    } else { escaped = false; }
    ++this$1.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) { this.unexpected(flagsStart); }

  // Validate pattern
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);

  // Create Literal#value property value.
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
    // ESTree requires null if it failed to instantiate RegExp object.
    // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
  }

  return this.finishToken(types.regexp, {pattern: pattern, flags: flags, value: value})
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp$8.readInt = function(radix, len) {
  var this$1 = this;

  var start = this.pos, total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this$1.input.charCodeAt(this$1.pos), val = (void 0);
    if (code >= 97) { val = code - 97 + 10; } // a
    else if (code >= 65) { val = code - 65 + 10; } // A
    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
    else { val = Infinity; }
    if (val >= radix) { break }
    ++this$1.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) { return null }

  return total
};

pp$8.readRadixNumber = function(radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
  return this.finishToken(types.num, val)
};

// Read an integer, octal integer, or floating-point number.

pp$8.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) { this.raise(start, "Invalid number"); }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
  var next = this.input.charCodeAt(this.pos);
  if (next === 46 && !octal) { // '.'
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) { ++this.pos; } // '+-'
    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

  var str = this.input.slice(start, this.pos);
  var val = octal ? parseInt(str, 8) : parseFloat(str);
  return this.finishToken(types.num, val)
};

// Read a string value, interpreting backslash-escapes.

pp$8.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;

  if (ch === 123) { // '{'
    if (this.options.ecmaVersion < 6) { this.unexpected(); }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
  } else {
    code = this.readHexChar(4);
  }
  return code
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) { return String.fromCharCode(code) }
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
}

pp$8.readString = function(quote) {
  var this$1 = this;

  var out = "", chunkStart = ++this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated string constant"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === quote) { break }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(false);
      chunkStart = this$1.pos;
    } else {
      if (isNewLine(ch, this$1.options.ecmaVersion >= 10)) { this$1.raise(this$1.start, "Unterminated string constant"); }
      ++this$1.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types.string, out)
};

// Reads template string tokens.

var INVALID_TEMPLATE_ESCAPE_ERROR = {};

pp$8.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err
    }
  }

  this.inTemplateElement = false;
};

pp$8.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR
  } else {
    this.raise(position, message);
  }
};

pp$8.readTmplToken = function() {
  var this$1 = this;

  var out = "", chunkStart = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated template"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
      if (this$1.pos === this$1.start && (this$1.type === types.template || this$1.type === types.invalidTemplate)) {
        if (ch === 36) {
          this$1.pos += 2;
          return this$1.finishToken(types.dollarBraceL)
        } else {
          ++this$1.pos;
          return this$1.finishToken(types.backQuote)
        }
      }
      out += this$1.input.slice(chunkStart, this$1.pos);
      return this$1.finishToken(types.template, out)
    }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(true);
      chunkStart = this$1.pos;
    } else if (isNewLine(ch)) {
      out += this$1.input.slice(chunkStart, this$1.pos);
      ++this$1.pos;
      switch (ch) {
      case 13:
        if (this$1.input.charCodeAt(this$1.pos) === 10) { ++this$1.pos; }
      case 10:
        out += "\n";
        break
      default:
        out += String.fromCharCode(ch);
        break
      }
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      chunkStart = this$1.pos;
    } else {
      ++this$1.pos;
    }
  }
};

// Reads a template token to search for the end, without validating any escape sequences
pp$8.readInvalidTemplateToken = function() {
  var this$1 = this;

  for (; this.pos < this.input.length; this.pos++) {
    switch (this$1.input[this$1.pos]) {
    case "\\":
      ++this$1.pos;
      break

    case "$":
      if (this$1.input[this$1.pos + 1] !== "{") {
        break
      }
    // falls through

    case "`":
      return this$1.finishToken(types.invalidTemplate, this$1.input.slice(this$1.start, this$1.pos))

    // no default
    }
  }
  this.raise(this.start, "Unterminated template");
};

// Used to read escaped characters

pp$8.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
    return ""
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
      var octal = parseInt(octalStr, 8);
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1);
        octal = parseInt(octalStr, 8);
      }
      this.pos += octalStr.length - 1;
      ch = this.input.charCodeAt(this.pos);
      if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
        this.invalidStringToken(
          this.pos - 1 - octalStr.length,
          inTemplate
            ? "Octal literal in template string"
            : "Octal literal in strict mode"
        );
      }
      return String.fromCharCode(octal)
    }
    return String.fromCharCode(ch)
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp$8.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
  return n
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp$8.readWord1 = function() {
  var this$1 = this;

  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this$1.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this$1.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) { // "\"
      this$1.containsEsc = true;
      word += this$1.input.slice(chunkStart, this$1.pos);
      var escStart = this$1.pos;
      if (this$1.input.charCodeAt(++this$1.pos) !== 117) // "u"
        { this$1.invalidStringToken(this$1.pos, "Expecting Unicode escape sequence \\uXXXX"); }
      ++this$1.pos;
      var esc = this$1.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        { this$1.invalidStringToken(escStart, "Invalid Unicode escape"); }
      word += codePointToString(esc);
      chunkStart = this$1.pos;
    } else {
      break
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos)
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp$8.readWord = function() {
  var word = this.readWord1();
  var type = types.name;
  if (this.keywords.test(word)) {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword " + word); }
    type = keywords$1[word];
  }
  return this.finishToken(type, word)
};

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/acornjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/acornjs/acorn/issues
//
// [walk]: util/walk.js

var version = "6.0.2";

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return Parser.parse(input, options)
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  return Parser.parseExpressionAt(input, pos, options)
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return Parser.tokenizer(input, options)
}

exports.version = version;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;
exports.Parser = Parser;
exports.defaultOptions = defaultOptions;
exports.Position = Position;
exports.SourceLocation = SourceLocation;
exports.getLineInfo = getLineInfo;
exports.Node = Node;
exports.TokenType = TokenType;
exports.tokTypes = types;
exports.keywordTypes = keywords$1;
exports.TokContext = TokContext;
exports.tokContexts = types$1;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierStart = isIdentifierStart;
exports.Token = Token;
exports.isNewLine = isNewLine;
exports.lineBreak = lineBreak;
exports.lineBreakG = lineBreakG;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

Object.defineProperty(exports, '__esModule', { value: true });

})));


},{}],40:[function(require,module,exports){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/asyncToGenerator'), require('broker-factory')) :
    typeof define === 'function' && define.amd ? define(['exports', '@babel/runtime/regenerator', '@babel/runtime/helpers/asyncToGenerator', 'broker-factory'], factory) :
    (factory((global.asyncArrayBufferBroker = {}),global._regeneratorRuntime,global._asyncToGenerator,global.brokerFactory));
}(this, (function (exports,_regeneratorRuntime,_asyncToGenerator,brokerFactory) { 'use strict';

    _regeneratorRuntime = _regeneratorRuntime && _regeneratorRuntime.hasOwnProperty('default') ? _regeneratorRuntime['default'] : _regeneratorRuntime;
    _asyncToGenerator = _asyncToGenerator && _asyncToGenerator.hasOwnProperty('default') ? _asyncToGenerator['default'] : _asyncToGenerator;

    var wrap = brokerFactory.createBroker({
      allocate: function allocate(_ref) {
        var call = _ref.call;
        return (
          /*#__PURE__*/
          function () {
            var _ref2 = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(length) {
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      return _context.abrupt("return", call('allocate', {
                        length: length
                      }));

                    case 1:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function (_x) {
              return _ref2.apply(this, arguments);
            };
          }()
        );
      },
      deallocate: function deallocate(_ref3) {
        var notify = _ref3.notify;
        return function (arrayBuffer) {
          notify('deallocate', {
            arrayBuffer: arrayBuffer
          }, [arrayBuffer]);
        };
      }
    });
    var load = function load(url) {
      var worker = new Worker(url);
      return wrap(worker);
    };

    exports.wrap = wrap;
    exports.load = load;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"@babel/runtime/helpers/asyncToGenerator":22,"@babel/runtime/regenerator":37,"broker-factory":42}],41:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('async-array-buffer-broker')) :
	typeof define === 'function' && define.amd ? define(['exports', 'async-array-buffer-broker'], factory) :
	(factory((global.asyncArrayBuffer = {}),global.asyncArrayBufferBroker));
}(this, (function (exports,asyncArrayBufferBroker) { 'use strict';

	// tslint:disable-next-line:max-line-length
	var worker = "!function(r){var n={};function o(e){if(n[e])return n[e].exports;var t=n[e]={i:e,l:!1,exports:{}};return r[e].call(t.exports,t,t.exports,o),t.l=!0,t.exports}o.m=r,o.c=n,o.d=function(e,t,r){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},o.r=function(e){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})},o.t=function(t,e){if(1&e&&(t=o(t)),8&e)return t;if(4&e&&\"object\"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(o.r(r),Object.defineProperty(r,\"default\",{enumerable:!0,value:t}),2&e&&\"string\"!=typeof t)for(var n in t)o.d(r,n,function(e){return t[e]}.bind(null,n));return r},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,\"a\",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p=\"\",o(o.s=0)}([function(e,t,r){\"use strict\";r.r(t);r(1)},function(e,t,r){!function(e){\"use strict\";e.createWorker(self,{allocate:function(e){var t=e.length,r=new ArrayBuffer(t);return{result:r,transferables:[r]}},deallocate:function(){return{result:void 0}}})}(r(2))},function(e,t,r){!function(e,t,g,l,h){\"use strict\";g=g&&g.hasOwnProperty(\"default\")?g.default:g,l=l&&l.hasOwnProperty(\"default\")?l.default:l;var r={INTERNAL_ERROR:-32603,INVALID_PARAMS:-32602,METHOD_NOT_FOUND:-32601},y=t.compile({message:'The requested method called \"${method}\" is not supported.',status:r.METHOD_NOT_FOUND}),w=t.compile({message:'The handler of the method called \"${method}\" returned no required result.',status:r.INTERNAL_ERROR}),x=t.compile({message:'The handler of the method called \"${method}\" returned an unexpected result.',status:r.INTERNAL_ERROR}),d=t.compile({message:'The specified parameter called \"portId\" with the given value \"${portId}\" does not identify a port connected to this worker.',status:r.INVALID_PARAMS}),p=function(){return new Promise(function(r){var e=new ArrayBuffer(0),t=new MessageChannel,n=t.port1,o=t.port2;n.onmessage=function(e){var t=e.data;return r(null!==t)},o.postMessage(e,[e])})},b=new Map;e.createWorker=function e(t,r){var n,v,m,o,i,a,u,c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:function(){return!0},s=(o=e,i=r,a=c,Object.assign({},i,{connect:function(e){var t=e.port;t.start();var r=o(t,i),n=h.generateUniqueNumber(b);return b.set(n,function(){r(),t.close(),b.delete(n)}),{result:n}},disconnect:function(e){var t=e.portId,r=b.get(t);if(void 0===r)throw d({portId:t.toString()});return r(),{result:null}},isSupported:(u=l(g.mark(function e(){var t,r;return g.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,p();case 2:if(!e.sent){e.next=14;break}if((t=a())instanceof Promise)return e.next=8,t;e.next=11;break;case 8:e.t0=e.sent,e.next=12;break;case 11:e.t0=t;case 12:return r=e.t0,e.abrupt(\"return\",{result:r});case 14:return e.abrupt(\"return\",{result:!1});case 15:case\"end\":return e.stop()}},e,this)})),function(){return u.apply(this,arguments)})})),f=(v=t,m=s,n=l(g.mark(function e(t){var r,n,o,i,a,u,c,s,f,l,h,d,p;return g.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(r=t.data,n=r.id,o=r.method,i=r.params,a=m[o],e.prev=2,void 0===a)throw y({method:o});e.next=5;break;case 5:if(void 0===(u=void 0===i?a():a(i)))throw w({method:o});e.next=8;break;case 8:if(u instanceof Promise)return e.next=11,u;e.next=14;break;case 11:e.t0=e.sent,e.next=15;break;case 14:e.t0=u;case 15:if(c=e.t0,null!==n){e.next=21;break}if(void 0!==c.result)throw x({method:o});e.next=19;break;case 19:e.next=25;break;case 21:if(void 0===c.result)throw x({method:o});e.next=23;break;case 23:s=c.result,f=c.transferables,l=void 0===f?[]:f,v.postMessage({id:n,result:s},l);case 25:e.next=31;break;case 27:e.prev=27,e.t1=e.catch(2),h=e.t1.message,d=e.t1.status,p=void 0===d?-32603:d,v.postMessage({error:{code:p,message:h},id:n});case 31:case\"end\":return e.stop()}},e,this,[[2,27]])})),function(e){return n.apply(this,arguments)});return t.addEventListener(\"message\",f),function(){return t.removeEventListener(\"message\",f)}},e.isSupported=p,Object.defineProperty(e,\"__esModule\",{value:!0})}(t,r(3),r(10),r(13),r(14))},function(e,t,r){!function(e,s,o,i){\"use strict\";s=s&&s.hasOwnProperty(\"default\")?s.default:s,o=o&&o.hasOwnProperty(\"default\")?o.default:o,i=i&&i.hasOwnProperty(\"default\")?i.default:i;var f=function(e,t){return void 0===t?e:t.reduce(function(e,t){if(\"capitalize\"!==t)return\"dashify\"===t?o(e):\"prependIndefiniteArticle\"===t?\"\".concat(i(e),\" \").concat(e):e;var r=e.charAt(0).toUpperCase(),n=e.slice(1);return\"\".concat(r).concat(n)},e)},r=function(e,o){for(var t=/\\${([^.}]+)((\\.[^(]+\\(\\))*)}/g,r=[],n=t.exec(e);null!==n;){var i={modifiers:[],name:n[1]};if(void 0!==n[3])for(var a=/\\.[^(]+\\(\\)/g,u=a.exec(n[2]);null!==u;)i.modifiers.push(u[0].slice(1,-2)),u=a.exec(n[2]);r.push(i),n=t.exec(e)}var c=r.reduce(function(e,n){return e.map(function(e){return\"string\"==typeof e?e.split((t=n,r=t.name+t.modifiers.map(function(e){return\"\\\\.\".concat(e,\"\\\\(\\\\)\")}).join(\"\"),new RegExp(\"\\\\$\\\\{\".concat(r,\"}\"),\"g\"))).reduce(function(e,t,r){return 0===r?[t]:n.name in o?s(e).concat([f(o[n.name],n.modifiers),t]):s(e).concat([function(e){return f(e[n.name],n.modifiers)},t])},[]):[e];var t,r}).reduce(function(e,t){return s(e).concat(s(t))},[])},[e]);return function(r){return c.reduce(function(e,t){return\"string\"==typeof t?s(e).concat([t]):s(e).concat([t(r)])},[]).join(\"\")}};e.compile=function(a){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},u=void 0===a.code?void 0:r(a.code,e),c=void 0===a.message?void 0:r(a.message,e);function t(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},t=1<arguments.length?arguments[1]:void 0,r=void 0===t&&(e instanceof Error||void 0!==e.code&&\"Exception\"===e.code.slice(-9))?{cause:e,missingParameters:{}}:{cause:t,missingParameters:e},n=r.cause,o=r.missingParameters,i=void 0===c?new Error:new Error(c(o));return null!==n&&(i.cause=n),void 0!==u&&(i.code=u(o)),void 0!==a.status&&(i.status=a.status),i}return t},Object.defineProperty(e,\"__esModule\",{value:!0})}(t,r(4),r(8),r(9))},function(e,t,r){var n=r(5),o=r(6),i=r(7);e.exports=function(e){return n(e)||o(e)||i()}},function(e,t){e.exports=function(e){if(Array.isArray(e)){for(var t=0,r=new Array(e.length);t<e.length;t++)r[t]=e[t];return r}}},function(e,t){e.exports=function(e){if(Symbol.iterator in Object(e)||\"[object Arguments]\"===Object.prototype.toString.call(e))return Array.from(e)}},function(e,t){e.exports=function(){throw new TypeError(\"Invalid attempt to spread non-iterable instance\")}},function(e,t,r){\"use strict\";e.exports=function(e,t){if(\"string\"!=typeof e)throw new TypeError(\"expected a string\");return e.trim().replace(/([a-z])([A-Z])/g,\"$1-$2\").replace(/\\W/g,function(e){return/[\xC0-\u017E]/.test(e)?e:\"-\"}).replace(/^-+|-+$/g,\"\").replace(/-{2,}/g,function(e){return t&&t.condense?\"-\":e}).toLowerCase()}},function(e,t,r){var n=function(e){var t,r,n=/\\w+/.exec(e);if(!n)return\"an\";var o=(r=n[0]).toLowerCase(),i=[\"honest\",\"hour\",\"hono\"];for(t in i)if(0==o.indexOf(i[t]))return\"an\";if(1==o.length)return 0<=\"aedhilmnorsx\".indexOf(o)?\"an\":\"a\";if(r.match(/(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/))return\"an\";var a=[/^e[uw]/,/^onc?e\\b/,/^uni([^nmd]|mo)/,/^u[bcfhjkqrst][aeiou]/];for(t=0;t<a.length;t++)if(o.match(a[t]))return\"a\";return r.match(/^U[NK][AIEO]/)?\"a\":r==r.toUpperCase()?0<=\"aedhilmnorsx\".indexOf(o[0])?\"an\":\"a\":0<=\"aeiou\".indexOf(o[0])?\"an\":o.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)?\"an\":\"a\"};void 0!==e.exports?e.exports=n:window.indefiniteArticle=n},function(e,t,r){e.exports=r(11)},function(e,t,r){var n=function(){return this||\"object\"==typeof self&&self}()||Function(\"return this\")(),o=n.regeneratorRuntime&&0<=Object.getOwnPropertyNames(n).indexOf(\"regeneratorRuntime\"),i=o&&n.regeneratorRuntime;if(n.regeneratorRuntime=void 0,e.exports=r(12),o)n.regeneratorRuntime=i;else try{delete n.regeneratorRuntime}catch(e){n.regeneratorRuntime=void 0}},function(M,e){!function(e){\"use strict\";var c,t=Object.prototype,s=t.hasOwnProperty,r=\"function\"==typeof Symbol?Symbol:{},o=r.iterator||\"@@iterator\",n=r.asyncIterator||\"@@asyncIterator\",i=r.toStringTag||\"@@toStringTag\",a=\"object\"==typeof M,u=e.regeneratorRuntime;if(u)a&&(M.exports=u);else{(u=e.regeneratorRuntime=a?M.exports:{}).wrap=w;var l=\"suspendedStart\",h=\"suspendedYield\",d=\"executing\",p=\"completed\",v={},f={};f[o]=function(){return this};var m=Object.getPrototypeOf,g=m&&m(m(k([])));g&&g!==t&&s.call(g,o)&&(f=g);var y=E.prototype=b.prototype=Object.create(f);O.prototype=y.constructor=E,E.constructor=O,E[i]=O.displayName=\"GeneratorFunction\",u.isGeneratorFunction=function(e){var t=\"function\"==typeof e&&e.constructor;return!!t&&(t===O||\"GeneratorFunction\"===(t.displayName||t.name))},u.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,E):(e.__proto__=E,i in e||(e[i]=\"GeneratorFunction\")),e.prototype=Object.create(y),e},u.awrap=function(e){return{__await:e}},L(_.prototype),_.prototype[n]=function(){return this},u.AsyncIterator=_,u.async=function(e,t,r,n){var o=new _(w(e,t,r,n));return u.isGeneratorFunction(t)?o:o.next().then(function(e){return e.done?e.value:o.next()})},L(y),y[i]=\"Generator\",y[o]=function(){return this},y.toString=function(){return\"[object Generator]\"},u.keys=function(r){var n=[];for(var e in r)n.push(e);return n.reverse(),function e(){for(;n.length;){var t=n.pop();if(t in r)return e.value=t,e.done=!1,e}return e.done=!0,e}},u.values=k,R.prototype={constructor:R,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=c,this.done=!1,this.delegate=null,this.method=\"next\",this.arg=c,this.tryEntries.forEach(j),!e)for(var t in this)\"t\"===t.charAt(0)&&s.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=c)},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if(\"throw\"===e.type)throw e.arg;return this.rval},dispatchException:function(r){if(this.done)throw r;var n=this;function e(e,t){return i.type=\"throw\",i.arg=r,n.next=e,t&&(n.method=\"next\",n.arg=c),!!t}for(var t=this.tryEntries.length-1;0<=t;--t){var o=this.tryEntries[t],i=o.completion;if(\"root\"===o.tryLoc)return e(\"end\");if(o.tryLoc<=this.prev){var a=s.call(o,\"catchLoc\"),u=s.call(o,\"finallyLoc\");if(a&&u){if(this.prev<o.catchLoc)return e(o.catchLoc,!0);if(this.prev<o.finallyLoc)return e(o.finallyLoc)}else if(a){if(this.prev<o.catchLoc)return e(o.catchLoc,!0)}else{if(!u)throw new Error(\"try statement without catch or finally\");if(this.prev<o.finallyLoc)return e(o.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;0<=r;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&s.call(n,\"finallyLoc\")&&this.prev<n.finallyLoc){var o=n;break}}o&&(\"break\"===e||\"continue\"===e)&&o.tryLoc<=t&&t<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=e,i.arg=t,o?(this.method=\"next\",this.next=o.finallyLoc,v):this.complete(i)},complete:function(e,t){if(\"throw\"===e.type)throw e.arg;return\"break\"===e.type||\"continue\"===e.type?this.next=e.arg:\"return\"===e.type?(this.rval=this.arg=e.arg,this.method=\"return\",this.next=\"end\"):\"normal\"===e.type&&t&&(this.next=t),v},finish:function(e){for(var t=this.tryEntries.length-1;0<=t;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),j(r),v}},catch:function(e){for(var t=this.tryEntries.length-1;0<=t;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if(\"throw\"===n.type){var o=n.arg;j(r)}return o}}throw new Error(\"illegal catch attempt\")},delegateYield:function(e,t,r){return this.delegate={iterator:k(e),resultName:t,nextLoc:r},\"next\"===this.method&&(this.arg=c),v}}}function w(e,t,r,n){var i,a,u,c,o=t&&t.prototype instanceof b?t:b,s=Object.create(o.prototype),f=new R(n||[]);return s._invoke=(i=e,a=r,u=f,c=l,function(e,t){if(c===d)throw new Error(\"Generator is already running\");if(c===p){if(\"throw\"===e)throw t;return A()}for(u.method=e,u.arg=t;;){var r=u.delegate;if(r){var n=N(r,u);if(n){if(n===v)continue;return n}}if(\"next\"===u.method)u.sent=u._sent=u.arg;else if(\"throw\"===u.method){if(c===l)throw c=p,u.arg;u.dispatchException(u.arg)}else\"return\"===u.method&&u.abrupt(\"return\",u.arg);c=d;var o=x(i,a,u);if(\"normal\"===o.type){if(c=u.done?p:h,o.arg===v)continue;return{value:o.arg,done:u.done}}\"throw\"===o.type&&(c=p,u.method=\"throw\",u.arg=o.arg)}}),s}function x(e,t,r){try{return{type:\"normal\",arg:e.call(t,r)}}catch(e){return{type:\"throw\",arg:e}}}function b(){}function O(){}function E(){}function L(e){[\"next\",\"throw\",\"return\"].forEach(function(t){e[t]=function(e){return this._invoke(t,e)}})}function _(c){var t;this._invoke=function(r,n){function e(){return new Promise(function(e,t){!function t(e,r,n,o){var i=x(c[e],c,r);if(\"throw\"!==i.type){var a=i.arg,u=a.value;return u&&\"object\"==typeof u&&s.call(u,\"__await\")?Promise.resolve(u.__await).then(function(e){t(\"next\",e,n,o)},function(e){t(\"throw\",e,n,o)}):Promise.resolve(u).then(function(e){a.value=e,n(a)},function(e){return t(\"throw\",e,n,o)})}o(i.arg)}(r,n,e,t)})}return t=t?t.then(e,e):e()}}function N(e,t){var r=e.iterator[t.method];if(r===c){if(t.delegate=null,\"throw\"===t.method){if(e.iterator.return&&(t.method=\"return\",t.arg=c,N(e,t),\"throw\"===t.method))return v;t.method=\"throw\",t.arg=new TypeError(\"The iterator does not provide a 'throw' method\")}return v}var n=x(r,e.iterator,t.arg);if(\"throw\"===n.type)return t.method=\"throw\",t.arg=n.arg,t.delegate=null,v;var o=n.arg;return o?o.done?(t[e.resultName]=o.value,t.next=e.nextLoc,\"return\"!==t.method&&(t.method=\"next\",t.arg=c),t.delegate=null,v):o:(t.method=\"throw\",t.arg=new TypeError(\"iterator result is not an object\"),t.delegate=null,v)}function P(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t)}function j(e){var t=e.completion||{};t.type=\"normal\",delete t.arg,e.completion=t}function R(e){this.tryEntries=[{tryLoc:\"root\"}],e.forEach(P,this),this.reset(!0)}function k(t){if(t){var e=t[o];if(e)return e.call(t);if(\"function\"==typeof t.next)return t;if(!isNaN(t.length)){var r=-1,n=function e(){for(;++r<t.length;)if(s.call(t,r))return e.value=t[r],e.done=!1,e;return e.value=c,e.done=!0,e};return n.next=n}}return{next:A}}function A(){return{value:c,done:!0}}}(function(){return this||\"object\"==typeof self&&self}()||Function(\"return this\")())},function(e,t){function c(e,t,r,n,o,i,a){try{var u=e[i](a),c=u.value}catch(e){return void r(e)}u.done?t(c):Promise.resolve(c).then(n,o)}e.exports=function(u){return function(){var e=this,a=arguments;return new Promise(function(t,r){var n=u.apply(e,a);function o(e){c(n,t,r,o,i,\"next\",e)}function i(e){c(n,t,r,o,i,\"throw\",e)}o(void 0)})}}},function(e,t,r){!function(e){\"use strict\";var n=new WeakMap,o=Number.MAX_SAFE_INTEGER||9007199254740991,i=function(e,t){return n.set(e,t),t},r=function(e){var t=n.get(e),r=void 0===t?e.size:2147483648<t?0:t+1;if(!e.has(r))return i(e,r);if(e.size<1073741824){for(;e.has(r);)r=Math.floor(2147483648*Math.random());return i(e,r)}if(e.size>o)throw new Error(\"Congratulations, you created a collection of unique numbers which uses all available integers!\");for(;e.has(r);)r=Math.floor(Math.random()*o);return i(e,r)};e.addUniqueNumber=function(e){var t=r(e);return e.add(t),t},e.generateUniqueNumber=r,Object.defineProperty(e,\"__esModule\",{value:!0})}(t)}]);";

	var blob = new Blob([worker], {
	  type: 'application/javascript; charset=utf-8'
	});
	var url = URL.createObjectURL(blob);
	var asyncArrayBuffer = asyncArrayBufferBroker.load(url);
	var allocate = asyncArrayBuffer.allocate;
	var connect = asyncArrayBuffer.connect;
	var deallocate = asyncArrayBuffer.deallocate;
	var disconnect = asyncArrayBuffer.disconnect;
	var isSupported = asyncArrayBuffer.isSupported;
	URL.revokeObjectURL(url);

	exports.allocate = allocate;
	exports.connect = connect;
	exports.deallocate = deallocate;
	exports.disconnect = disconnect;
	exports.isSupported = isSupported;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"async-array-buffer-broker":40}],42:[function(require,module,exports){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@babel/runtime/helpers/defineProperty'), require('@babel/runtime/helpers/slicedToArray'), require('fast-unique-numbers'), require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/asyncToGenerator')) :
    typeof define === 'function' && define.amd ? define(['exports', '@babel/runtime/helpers/defineProperty', '@babel/runtime/helpers/slicedToArray', 'fast-unique-numbers', '@babel/runtime/regenerator', '@babel/runtime/helpers/asyncToGenerator'], factory) :
    (factory((global.brokerFactory = {}),global._defineProperty,global._slicedToArray,global.fastUniqueNumbers,global._regeneratorRuntime,global._asyncToGenerator));
}(this, (function (exports,_defineProperty,_slicedToArray,fastUniqueNumbers,_regeneratorRuntime,_asyncToGenerator) { 'use strict';

    _defineProperty = _defineProperty && _defineProperty.hasOwnProperty('default') ? _defineProperty['default'] : _defineProperty;
    _slicedToArray = _slicedToArray && _slicedToArray.hasOwnProperty('default') ? _slicedToArray['default'] : _slicedToArray;
    _regeneratorRuntime = _regeneratorRuntime && _regeneratorRuntime.hasOwnProperty('default') ? _regeneratorRuntime['default'] : _regeneratorRuntime;
    _asyncToGenerator = _asyncToGenerator && _asyncToGenerator.hasOwnProperty('default') ? _asyncToGenerator['default'] : _asyncToGenerator;

    var isMessagePort = function isMessagePort(sender) {
      return typeof sender.start === 'function';
    };

    var PORT_MAP = new WeakMap();

    var extendBrokerImplementation = function extendBrokerImplementation(partialBrokerImplementation) {
      return Object.assign({}, partialBrokerImplementation, {
        connect: function connect(_ref) {
          var call = _ref.call;
          return (
            /*#__PURE__*/
            _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee() {
              var _ref3, port1, port2, portId;

              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _ref3 = new MessageChannel(), port1 = _ref3.port1, port2 = _ref3.port2;
                      _context.next = 3;
                      return call('connect', {
                        port: port1
                      }, [port1]);

                    case 3:
                      portId = _context.sent;
                      PORT_MAP.set(port2, portId);
                      return _context.abrupt("return", port2);

                    case 6:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }))
          );
        },
        disconnect: function disconnect(_ref4) {
          var call = _ref4.call;
          return (
            /*#__PURE__*/
            function () {
              var _ref5 = _asyncToGenerator(
              /*#__PURE__*/
              _regeneratorRuntime.mark(function _callee2(port) {
                var portId;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        portId = PORT_MAP.get(port);

                        if (!(portId === undefined)) {
                          _context2.next = 3;
                          break;
                        }

                        throw new Error('The given port is not connected.');

                      case 3:
                        _context2.next = 5;
                        return call('disconnect', {
                          portId: portId
                        });

                      case 5:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x) {
                return _ref5.apply(this, arguments);
              };
            }()
          );
        },
        isSupported: function isSupported(_ref6) {
          var call = _ref6.call;
          return function () {
            return call('isSupported');
          };
        }
      });
    };

    var ONGOING_REQUESTS = new WeakMap();

    var createOrGetOngoingRequests = function createOrGetOngoingRequests(sender) {
      if (ONGOING_REQUESTS.has(sender)) {
        // @todo TypeScript needs to be convinced that has() works as expected.
        return ONGOING_REQUESTS.get(sender);
      }

      var ongoingRequests = new Map();
      ONGOING_REQUESTS.set(sender, ongoingRequests);
      return ongoingRequests;
    };

    var createBroker = function createBroker(brokerImplementation) {
      var fullBrokerImplementation = extendBrokerImplementation(brokerImplementation);
      return function (sender) {
        var ongoingRequests = createOrGetOngoingRequests(sender);
        sender.addEventListener('message', function (_ref) {
          var message = _ref.data;
          var id = message.id;

          if (id !== null && ongoingRequests.has(id)) {
            var _ongoingRequests$get = ongoingRequests.get(id),
                reject = _ongoingRequests$get.reject,
                resolve = _ongoingRequests$get.resolve;

            ongoingRequests.delete(id);

            if (message.error === undefined) {
              resolve(message.result);
            } else {
              reject(new Error(message.error.message));
            }
          }
        });

        if (isMessagePort(sender)) {
          sender.start();
        }

        var call = function call(method) {
          var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
          var transferables = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
          return new Promise(function (resolve, reject) {
            var id = fastUniqueNumbers.generateUniqueNumber(ongoingRequests);
            ongoingRequests.set(id, {
              reject: reject,
              resolve: resolve
            });

            if (params === null) {
              sender.postMessage({
                id: id,
                method: method
              }, transferables);
            } else {
              sender.postMessage({
                id: id,
                method: method,
                params: params
              }, transferables);
            }
          });
        };

        var notify = function notify(method, params) {
          var transferables = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
          sender.postMessage({
            id: null,
            method: method,
            params: params
          }, transferables);
        };

        var functions = {};

        var _arr = Object.entries(fullBrokerImplementation);

        for (var _i = 0; _i < _arr.length; _i++) {
          var _arr$_i = _slicedToArray(_arr[_i], 2),
              key = _arr$_i[0],
              handler = _arr$_i[1];

          functions = Object.assign({}, functions, _defineProperty({}, key, handler({
            call: call,
            notify: notify
          })));
        }

        return Object.assign({}, functions);
      };
    };

    exports.createBroker = createBroker;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"@babel/runtime/helpers/asyncToGenerator":22,"@babel/runtime/helpers/defineProperty":25,"@babel/runtime/helpers/slicedToArray":34,"@babel/runtime/regenerator":37,"fast-unique-numbers":43}],43:[function(require,module,exports){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.fastUniqueNumbers = {})));
}(this, (function (exports) { 'use strict';

    var LAST_NUMBER_WEAK_MAP = new WeakMap();
    /*
     * The value of the constant Number.MAX_SAFE_INTEGER equals (2 ** 53 - 1) but it
     * is fairly new.
     */

    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

    var cache = function cache(collection, nextNumber) {
      LAST_NUMBER_WEAK_MAP.set(collection, nextNumber);
      return nextNumber;
    };

    var generateUniqueNumber = function generateUniqueNumber(collection) {
      var lastNumber = LAST_NUMBER_WEAK_MAP.get(collection);
      /*
       * Let's try the cheapest algorithm first. It might fail to produce a new
       * number, but it is so cheap that it is okay to take the risk. Just
       * increase the last number by one or reset it to 0 if we reached the upper
       * bound of SMIs (which stands for small integers). When the last number is
       * unknown it is assumed that the collection contains zero based consecutive
       * numbers.
       */

      var nextNumber = lastNumber === undefined ? collection.size : lastNumber > 2147483648 ? 0 : lastNumber + 1;

      if (!collection.has(nextNumber)) {
        return cache(collection, nextNumber);
      }
      /*
       * If there are less than half of 2 ** 31 numbers stored in the collection,
       * the chance to generate a new random number in the range from 0 to 2 ** 31
       * is at least 50%. It's benifitial to use only SMIs because they perform
       * much better in any environment based on V8.
       */


      if (collection.size < 1073741824) {
        while (collection.has(nextNumber)) {
          nextNumber = Math.floor(Math.random() * 2147483648);
        }

        return cache(collection, nextNumber);
      } // Quickly check if there is a theoretical chance to generate a new number.


      if (collection.size > MAX_SAFE_INTEGER) {
        throw new Error('Congratulations, you created a collection of unique numbers which uses all available integers!');
      } // Otherwise use the full scale of safely usable integers.


      while (collection.has(nextNumber)) {
        nextNumber = Math.floor(Math.random() * MAX_SAFE_INTEGER);
      }

      return cache(collection, nextNumber);
    };

    var addUniqueNumber = function addUniqueNumber(set) {
      var number = generateUniqueNumber(set);
      set.add(number);
      return number;
    };

    exports.addUniqueNumber = addUniqueNumber;
    exports.generateUniqueNumber = generateUniqueNumber;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],44:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = require("./runtime");

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

},{"./runtime":45}],45:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);

},{}],46:[function(require,module,exports){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@babel/runtime/helpers/typeof'), require('@babel/runtime/helpers/classCallCheck'), require('@babel/runtime/helpers/slicedToArray'), require('@babel/runtime/helpers/createClass'), require('@babel/runtime/helpers/possibleConstructorReturn'), require('@babel/runtime/helpers/getPrototypeOf'), require('@babel/runtime/helpers/inherits'), require('@babel/runtime/helpers/toConsumableArray'), require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/asyncToGenerator'), require('@babel/runtime/helpers/assertThisInitialized'), require('@babel/runtime/helpers/defineProperty'), require('async-array-buffer'), require('tslib')) :
    typeof define === 'function' && define.amd ? define(['exports', '@babel/runtime/helpers/typeof', '@babel/runtime/helpers/classCallCheck', '@babel/runtime/helpers/slicedToArray', '@babel/runtime/helpers/createClass', '@babel/runtime/helpers/possibleConstructorReturn', '@babel/runtime/helpers/getPrototypeOf', '@babel/runtime/helpers/inherits', '@babel/runtime/helpers/toConsumableArray', '@babel/runtime/regenerator', '@babel/runtime/helpers/asyncToGenerator', '@babel/runtime/helpers/assertThisInitialized', '@babel/runtime/helpers/defineProperty', 'async-array-buffer', 'tslib'], factory) :
    (factory((global.standardizedAudioContext = {}),global._typeof,global._classCallCheck,global._slicedToArray,global._createClass,global._possibleConstructorReturn,global._getPrototypeOf,global._inherits,global._toConsumableArray,global._regeneratorRuntime,global._asyncToGenerator,global._assertThisInitialized,global._defineProperty,global.asyncArrayBuffer,global.tslib_1));
}(this, (function (exports,_typeof,_classCallCheck,_slicedToArray,_createClass,_possibleConstructorReturn,_getPrototypeOf,_inherits,_toConsumableArray,_regeneratorRuntime,_asyncToGenerator,_assertThisInitialized,_defineProperty,asyncArrayBuffer,tslib_1) { 'use strict';

    _typeof = _typeof && _typeof.hasOwnProperty('default') ? _typeof['default'] : _typeof;
    _classCallCheck = _classCallCheck && _classCallCheck.hasOwnProperty('default') ? _classCallCheck['default'] : _classCallCheck;
    _slicedToArray = _slicedToArray && _slicedToArray.hasOwnProperty('default') ? _slicedToArray['default'] : _slicedToArray;
    _createClass = _createClass && _createClass.hasOwnProperty('default') ? _createClass['default'] : _createClass;
    _possibleConstructorReturn = _possibleConstructorReturn && _possibleConstructorReturn.hasOwnProperty('default') ? _possibleConstructorReturn['default'] : _possibleConstructorReturn;
    _getPrototypeOf = _getPrototypeOf && _getPrototypeOf.hasOwnProperty('default') ? _getPrototypeOf['default'] : _getPrototypeOf;
    _inherits = _inherits && _inherits.hasOwnProperty('default') ? _inherits['default'] : _inherits;
    _toConsumableArray = _toConsumableArray && _toConsumableArray.hasOwnProperty('default') ? _toConsumableArray['default'] : _toConsumableArray;
    _regeneratorRuntime = _regeneratorRuntime && _regeneratorRuntime.hasOwnProperty('default') ? _regeneratorRuntime['default'] : _regeneratorRuntime;
    _asyncToGenerator = _asyncToGenerator && _asyncToGenerator.hasOwnProperty('default') ? _asyncToGenerator['default'] : _asyncToGenerator;
    _assertThisInitialized = _assertThisInitialized && _assertThisInitialized.hasOwnProperty('default') ? _assertThisInitialized['default'] : _assertThisInitialized;
    _defineProperty = _defineProperty && _defineProperty.hasOwnProperty('default') ? _defineProperty['default'] : _defineProperty;

    /*!
     * modernizr v3.6.0
     * Build https://modernizr.com/download?-promises-typedarrays-webaudio-dontmin
     *
     * Copyright (c)
     *  Faruk Ates
     *  Paul Irish
     *  Alex Sexton
     *  Ryan Seddon
     *  Patrick Kettner
     *  Stu Cox
     *  Richard Herrera

     * MIT License
     */
    var browsernizr = (function (window) {
      var tests = [];
      /**
       *
       * ModernizrProto is the constructor for Modernizr
       *
       * @class
       * @access public
       */

      var ModernizrProto = {
        // The current version, dummy
        _version: '3.6.0',
        // Any settings that don't work as separate modules
        // can go in here as configuration.
        _config: {
          'classPrefix': '',
          'enableClasses': true,
          'enableJSClass': true,
          'usePrefixes': true
        },
        // Queue of tests
        _q: [],
        // Stub these for people who are listening
        on: function on(test, cb) {
          // I don't really think people should do this, but we can
          // safe guard it a bit.
          // -- NOTE:: this gets WAY overridden in src/addTest for actual async tests.
          // This is in case people listen to synchronous tests. I would leave it out,
          // but the code to *disallow* sync tests in the real version of this
          // function is actually larger than this.
          var self = this;
          setTimeout(function () {
            cb(self[test]);
          }, 0);
        },
        addTest: function addTest(name, fn, options) {
          tests.push({
            name: name,
            fn: fn,
            options: options
          });
        },
        addAsyncTest: function addAsyncTest(fn) {
          tests.push({
            name: null,
            fn: fn
          });
        }
      }; // Fake some of Object.create so we can force non test results to be non "own" properties.

      var Modernizr = function Modernizr() {};

      Modernizr.prototype = ModernizrProto; // Leak modernizr globally when you `require` it rather than force it here.
      // Overwrite name so constructor name is nicer :D

      Modernizr = new Modernizr();
      var classes = [];
      /**
       * is returns a boolean if the typeof an obj is exactly type.
       *
       * @access private
       * @function is
       * @param {*} obj - A thing we want to check the type of
       * @param {string} type - A string to compare the typeof against
       * @returns {boolean}
       */

      function is(obj, type) {
        return _typeof(obj) === type;
      }
      /**
       * Run through all tests and detect their support in the current UA.
       *
       * @access private
       */

      function testRunner() {
        var featureNames;
        var feature;
        var aliasIdx;
        var result;
        var nameIdx;
        var featureName;
        var featureNameSplit;

        for (var featureIdx in tests) {
          if (tests.hasOwnProperty(featureIdx)) {
            featureNames = [];
            feature = tests[featureIdx]; // run the test, throw the return value into the Modernizr,
            // then based on that boolean, define an appropriate className
            // and push it into an array of classes we'll join later.
            //
            // If there is no name, it's an 'async' test that is run,
            // but not directly added to the object. That should
            // be done with a post-run addTest call.

            if (feature.name) {
              featureNames.push(feature.name.toLowerCase());

              if (feature.options && feature.options.aliases && feature.options.aliases.length) {
                // Add all the aliases into the names list
                for (aliasIdx = 0; aliasIdx < feature.options.aliases.length; aliasIdx++) {
                  featureNames.push(feature.options.aliases[aliasIdx].toLowerCase());
                }
              }
            } // Run the test, or use the raw value if it's not a function


            result = is(feature.fn, 'function') ? feature.fn() : feature.fn; // Set each of the names on the Modernizr object

            for (nameIdx = 0; nameIdx < featureNames.length; nameIdx++) {
              featureName = featureNames[nameIdx]; // Support dot properties as sub tests. We don't do checking to make sure
              // that the implied parent tests have been added. You must call them in
              // order (either in the test, or make the parent test a dependency).
              //
              // Cap it to TWO to make the logic simple and because who needs that kind of subtesting
              // hashtag famous last words

              featureNameSplit = featureName.split('.');

              if (featureNameSplit.length === 1) {
                Modernizr[featureNameSplit[0]] = result;
              } else {
                // cast to a Boolean, if not one already
                if (Modernizr[featureNameSplit[0]] && !(Modernizr[featureNameSplit[0]] instanceof Boolean)) {
                  Modernizr[featureNameSplit[0]] = new Boolean(Modernizr[featureNameSplit[0]]);
                }

                Modernizr[featureNameSplit[0]][featureNameSplit[1]] = result;
              }

              classes.push((result ? '' : 'no-') + featureNameSplit.join('-'));
            }
          }
        }
      }
      /*!
      {
        "name": "ES6 Promises",
        "property": "promises",
        "caniuse": "promises",
        "polyfills": ["es6promises"],
        "authors": ["Krister Kari", "Jake Archibald"],
        "tags": ["es6"],
        "notes": [{
          "name": "The ES6 promises spec",
          "href": "https://github.com/domenic/promises-unwrapping"
        },{
          "name": "Chromium dashboard - ES6 Promises",
          "href": "https://www.chromestatus.com/features/5681726336532480"
        },{
          "name": "JavaScript Promises: There and back again - HTML5 Rocks",
          "href": "http://www.html5rocks.com/en/tutorials/es6/promises/"
        }]
      }
      !*/

      /* DOC
      Check if browser implements ECMAScript 6 Promises per specification.
      */

      Modernizr.addTest('promises', function () {
        return 'Promise' in window && // Some of these methods are missing from
        // Firefox/Chrome experimental implementations
        'resolve' in window.Promise && 'reject' in window.Promise && 'all' in window.Promise && 'race' in window.Promise && // Older version of the spec had a resolver object
        // as the arg rather than a function
        function () {
          var resolve;
          new window.Promise(function (r) {
            resolve = r;
          });
          return typeof resolve === 'function';
        }();
      });
      /*!
      {
        "name": "Typed arrays",
        "property": "typedarrays",
        "caniuse": "typedarrays",
        "tags": ["js"],
        "authors": ["Stanley Stuart (@fivetanley)"],
        "notes": [{
          "name": "MDN documentation",
          "href": "https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays"
        },{
          "name": "Kronos spec",
          "href": "https://www.khronos.org/registry/typedarray/specs/latest/"
        }],
        "polyfills": ["joshuabell-polyfill"]
      }
      !*/

      /* DOC
      Detects support for native binary data manipulation via Typed Arrays in JavaScript.
      
      Does not check for DataView support; use `Modernizr.dataview` for that.
      */
      // Should fail in:
      // Internet Explorer <= 9
      // Firefox <= 3.6
      // Chrome <= 6.0
      // iOS Safari < 4.2
      // Safari < 5.1
      // Opera < 11.6
      // Opera Mini, <= 7.0
      // Android Browser < 4.0
      // Blackberry Browser < 10.0

      Modernizr.addTest('typedarrays', 'ArrayBuffer' in window);
      /*!
      {
        "name": "Web Audio API",
        "property": "webaudio",
        "caniuse": "audio-api",
        "polyfills": ["xaudiojs", "dynamicaudiojs", "audiolibjs"],
        "tags": ["audio", "media"],
        "builderAliases": ["audio_webaudio_api"],
        "authors": ["Addy Osmani"],
        "notes": [{
          "name": "W3 Specification",
          "href": "https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html"
        }]
      }
      !*/

      /* DOC
      Detects the older non standard webaudio API, (as opposed to the standards based AudioContext API)
      */

      Modernizr.addTest('webaudio', function () {
        var prefixed = 'webkitAudioContext' in window;
        var unprefixed = 'AudioContext' in window;

        if (Modernizr._config.usePrefixes) {
          return prefixed || unprefixed;
        }

        return unprefixed;
      }); // Run each test

      testRunner();
      delete ModernizrProto.addTest;
      delete ModernizrProto.addAsyncTest; // Run the things that are supposed to run after the tests

      for (var i = 0; i < Modernizr._q.length; i++) {
        Modernizr._q[i]();
      } // Leak Modernizr namespace


      return Modernizr;
    })(window);

    var createAbortError = function createAbortError() {
      try {
        return new DOMException('', 'AbortError');
      } catch (err) {
        err.code = 20;
        err.name = 'AbortError';
        return err;
      }
    };

    var AUDIO_NODE_STORE = new WeakMap();
    var AUDIO_GRAPHS = new WeakMap();
    var AUDIO_PARAM_STORE = new WeakMap();
    var BACKUP_NATIVE_CONTEXT_STORE = new WeakMap();
    var CONTEXT_STORE = new WeakMap();
    var DETACHED_ARRAY_BUFFERS = new WeakSet(); // This clunky name is borrowed from the spec. :-)

    var NODE_NAME_TO_PROCESSOR_DEFINITION_MAPS = new WeakMap();
    var NODE_TO_PROCESSOR_MAPS = new WeakMap();
    var TEST_RESULTS = new WeakMap();

    var evaluateSource = function evaluateSource(source) {
      return new Promise(function (resolve, reject) {
        var head = document.head;

        if (head === null) {
          reject(new SyntaxError());
        } else {
          var script = document.createElement('script'); // @todo Safari doesn't like URLs with a type of 'application/javascript; charset=utf-8'.

          var blob = new Blob([source], {
            type: 'application/javascript'
          });
          var url = URL.createObjectURL(blob);
          var originalOnErrorHandler = window.onerror;

          var removeErrorEventListenerAndRevokeUrl = function removeErrorEventListenerAndRevokeUrl() {
            window.onerror = originalOnErrorHandler;
            URL.revokeObjectURL(url);
          };

          window.onerror = function (message, src, lineno, colno, error) {
            // @todo Edge thinks the source is the one of the html document.
            if (src === url || src === location.href && lineno === 1 && colno === 1) {
              removeErrorEventListenerAndRevokeUrl();
              reject(error);
              return false;
            }

            if (originalOnErrorHandler !== null) {
              return originalOnErrorHandler(message, src, lineno, colno, error);
            }
          };

          script.onerror = function () {
            removeErrorEventListenerAndRevokeUrl();
            reject(new SyntaxError());
          };

          script.onload = function () {
            removeErrorEventListenerAndRevokeUrl();
            resolve();
          };

          script.src = url;
          script.type = 'module';
          head.appendChild(script);
        }
      });
    };

    var createInvalidStateError = function createInvalidStateError() {
      try {
        return new DOMException('', 'InvalidStateError');
      } catch (err) {
        err.code = 11;
        err.name = 'InvalidStateError';
        return err;
      }
    };

    var getNativeContext = function getNativeContext(context) {
      var nativeContext = CONTEXT_STORE.get(context);

      if (nativeContext === undefined) {
        throw createInvalidStateError();
      }

      return nativeContext;
    };

    var handler = {
      construct: function construct() {
        return handler;
      }
    };
    var isConstructible = function isConstructible(constructible) {
      try {
        var proxy = new Proxy(constructible, handler);
        new proxy(); // tslint:disable-line:no-unused-expression
      } catch (_a) {
        return false;
      }

      return true;
    };

    /*
     * This massive regex tries to cover all the following cases.
     *
     * import './path';
     * import defaultImport from './path';
     * import { namedImport } from './path';
     * import { namedImport as renamendImport } from './path';
     * import * as namespaceImport from './path';
     * import defaultImport, { namedImport } from './path';
     * import defaultImport, { namedImport as renamendImport } from './path';
     * import defaultImport, * as namespaceImport from './path';
     */
    var IMPORT_STATEMENT_REGEX = /^import(?:(?:[\s]+[\w]+|(?:[\s]+[\w]+[\s]*,)?[\s]*\{[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?(?:[\s]*,[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?)*[\s]*}|(?:[\s]+[\w]+[\s]*,)?[\s]*\*[\s]+as[\s]+[\w]+)[\s]+from)?(?:[\s]*)("([^"\\]|\\.)+"|'([^'\\]|\\.)+')(?:[\s]*);?/; // tslint:disable-line:max-line-length

    var splitImportStatements = function splitImportStatements(source, url) {
      var importStatements = [];
      var sourceWithoutImportStatements = source.replace(/^[\s]+/, '');
      var result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);

      while (result !== null) {
        var unresolvedUrl = result[1].slice(1, -1);
        var importStatementWithResolvedUrl = result[0].replace(/([\s]+)?;?$/, '').replace(unresolvedUrl, new URL(unresolvedUrl, url).toString());
        importStatements.push(importStatementWithResolvedUrl);
        sourceWithoutImportStatements = sourceWithoutImportStatements.slice(result[0].length).replace(/^[\s]+/, '');
        result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
      }

      return [importStatements.join(';'), sourceWithoutImportStatements];
    };

    var verifyParameterDescriptors = function verifyParameterDescriptors(parameterDescriptors) {
      if (parameterDescriptors !== undefined && !Array.isArray(parameterDescriptors)) {
        throw new TypeError('The parameterDescriptors property of given value for processorCtor is not an array.');
      }
    };

    var verifyProcessorCtor = function verifyProcessorCtor(processorCtor) {
      if (!isConstructible(processorCtor)) {
        throw new TypeError('The given value for processorCtor should be a constructor.');
      }

      if (processorCtor.prototype === null || _typeof(processorCtor.prototype) !== 'object') {
        throw new TypeError('The given value for processorCtor should have a prototype.');
      }

      if (typeof processorCtor.prototype.process !== 'function') {
        throw new TypeError('The given value for processorCtor should have a callable process() function.');
      }
    };

    var ongoingRequests = new WeakMap();
    var resolvedRequests = new WeakMap();
    var createAddAudioWorkletModule = function createAddAudioWorkletModule(createAbortError, createNotSupportedError, fetchSource, getBackupNativeContext) {
      return function (context, moduleURL) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
          credentials: 'omit'
        };
        var nativeContext = getNativeContext(context);
        var absoluteUrl = new URL(moduleURL, location.href).toString(); // Bug #59: Only Chrome & Opera do implement the audioWorklet property.
        // @todo Define the native interface as part of the native AudioContext.

        if (nativeContext.audioWorklet !== undefined) {
          return fetchSource(moduleURL).then(function (source) {
            var _splitImportStatement = splitImportStatements(source, absoluteUrl),
                _splitImportStatement2 = _slicedToArray(_splitImportStatement, 2),
                importStatements = _splitImportStatement2[0],
                sourceWithoutImportStatements = _splitImportStatement2[1];
            /*
             * Bug #86: Chrome Canary does not invoke the process() function if the corresponding AudioWorkletNode has no output.
             *
             * This is the unminified version of the code used below:
             *
             * ```js
             * `${ importStatements };
             * ((registerProcessor) => {${ sourceWithoutImportStatements }
             * })((name, processorCtor) => registerProcessor(name, class extends processorCtor {
             *
             *     constructor (options) {
             *         const { hasNoOutput, ...otherParameterData } = options.parameterData;
             *
             *         if (hasNoOutput === 1) {
             *             super({ ...options, numberOfOutputs: 0, outputChannelCount: [ ], parameterData: otherParameterData });
             *
             *             this._hasNoOutput = true;
             *         } else {
             *             super(options);
             *
             *             this._hasNoOutput = false;
             *         }
             *     }
             *
             *     process (inputs, outputs, parameters) {
             *         return super.process(inputs, (this._hasNoOutput) ? [ ] : outputs, parameters);
             *     }
             *
             * }))`
             * ```
             */


            var wrappedSource = "".concat(importStatements, ";(registerProcessor=>{").concat(sourceWithoutImportStatements, "\n})((n,p)=>registerProcessor(n,class extends p{constructor(o){const{hasNoOutput,...q}=o.parameterData;if(hasNoOutput===1){super({...o,numberOfOutputs:0,outputChannelCount:[],parameterData:q});this._h=true}else{super(o);this._h=false}}process(i,o,p){return super.process(i,(this._h)?[]:o,p)}}))"); // tslint:disable-line:max-line-length

            var blob = new Blob([wrappedSource], {
              type: 'application/javascript; charset=utf-8'
            });
            var url = URL.createObjectURL(blob);
            var backupNativeContext = getBackupNativeContext(nativeContext);
            var nativeContextOrBackupNativeContext = backupNativeContext !== null ? backupNativeContext : nativeContext;
            return nativeContextOrBackupNativeContext.audioWorklet.addModule(url, options).then(function () {
              return URL.revokeObjectURL(url);
            }) // @todo This could be written more elegantly when Promise.finally() becomes avalaible.
            .catch(function (err) {
              URL.revokeObjectURL(url);
              throw err; // tslint:disable-line:rxjs-throw-error
            });
          });
        } else {
          var resolvedRequestsOfContext = resolvedRequests.get(context);

          if (resolvedRequestsOfContext !== undefined && resolvedRequestsOfContext.has(moduleURL)) {
            return Promise.resolve();
          }

          var ongoingRequestsOfContext = ongoingRequests.get(context);

          if (ongoingRequestsOfContext !== undefined) {
            var promiseOfOngoingRequest = ongoingRequestsOfContext.get(moduleURL);

            if (promiseOfOngoingRequest !== undefined) {
              return promiseOfOngoingRequest;
            }
          }

          var promise = fetchSource(moduleURL).then(function (source) {
            var _splitImportStatement3 = splitImportStatements(source, absoluteUrl),
                _splitImportStatement4 = _slicedToArray(_splitImportStatement3, 2),
                importStatements = _splitImportStatement4[0],
                sourceWithoutImportStatements = _splitImportStatement4[1];
            /*
             * This is the unminified version of the code used below:
             *
             * ```js
             * ${ importStatements };
             * ((a, b) => {
             *     (a[b] = a[b] || [ ]).push(
             *         (AudioWorkletProcessor, currentFrame, currentTime, global, egisterProcessor, sampleRate, self, window) => {
             *             ${ sourceWithoutImportStatements }
             *         }
             *     );
             * })(window, '_AWGS');
             * ```
             */
            // tslint:disable-next-line:max-line-length


            var wrappedSource = "".concat(importStatements, ";((a,b)=>{(a[b]=a[b]||[]).push((AudioWorkletProcessor,currentFrame,currentTime,global,registerProcessor,sampleRate,self,window)=>{").concat(sourceWithoutImportStatements, "\n})})(window,'_AWGS')"); // @todo Evaluating the given source code is a possible security problem.

            return evaluateSource(wrappedSource);
          }).then(function () {
            var globalScope = Object.create(null, {
              currentFrame: {
                get: function get() {
                  return nativeContext.currentTime * nativeContext.sampleRate;
                }
              },
              currentTime: {
                get: function get() {
                  return nativeContext.currentTime;
                }
              },
              sampleRate: {
                get: function get() {
                  return nativeContext.sampleRate;
                }
              }
            });

            var evaluateAudioWorkletGlobalScope = window._AWGS.pop();

            if (evaluateAudioWorkletGlobalScope === undefined) {
              throw new SyntaxError();
            }

            evaluateAudioWorkletGlobalScope(function AudioWorkletProcessor() {
              _classCallCheck(this, AudioWorkletProcessor);
            }, globalScope.currentFrame, globalScope.currentTime, undefined, function (name, processorCtor) {
              if (name.trim() === '') {
                throw createNotSupportedError();
              }

              var nodeNameToProcessorDefinitionMap = NODE_NAME_TO_PROCESSOR_DEFINITION_MAPS.get(nativeContext);

              if (nodeNameToProcessorDefinitionMap !== undefined) {
                if (nodeNameToProcessorDefinitionMap.has(name)) {
                  throw createNotSupportedError();
                }

                verifyProcessorCtor(processorCtor);
                verifyParameterDescriptors(processorCtor.parameterDescriptors);
                nodeNameToProcessorDefinitionMap.set(name, processorCtor);
              } else {
                verifyProcessorCtor(processorCtor);
                verifyParameterDescriptors(processorCtor.parameterDescriptors);
                NODE_NAME_TO_PROCESSOR_DEFINITION_MAPS.set(nativeContext, new Map([[name, processorCtor]]));
              }
            }, globalScope.sampleRate, undefined, undefined);
          }).catch(function (err) {
            if (err.name === 'SyntaxError') {
              throw createAbortError();
            }

            throw err; // tslint:disable-line:rxjs-throw-error
          });

          if (ongoingRequestsOfContext === undefined) {
            ongoingRequests.set(context, new Map([[moduleURL, promise]]));
          } else {
            ongoingRequestsOfContext.set(moduleURL, promise);
          }

          promise.then(function () {
            var rslvdRqstsFCntxt = resolvedRequests.get(context);

            if (rslvdRqstsFCntxt === undefined) {
              resolvedRequests.set(context, new Set([moduleURL]));
            } else {
              rslvdRqstsFCntxt.add(moduleURL);
            }
          }).catch(function () {}) // tslint:disable-line:no-empty
          // @todo Use finally when it becomes available in all supported browsers.
          .then(function () {
            var ngngRqstsFCntxt = ongoingRequests.get(context);

            if (ngngRqstsFCntxt !== undefined) {
              ngngRqstsFCntxt.delete(moduleURL);
            }
          });
          return promise;
        }
      };
    };

    var DEFAULT_OPTIONS = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      fftSize: 2048,
      maxDecibels: -30,
      minDecibels: -100,
      smoothingTimeConstant: 0.8
    };
    var createAnalyserNodeConstructor = function createAnalyserNodeConstructor(createAnalyserNodeRenderer, createNativeAnalyserNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(AnalyserNode, _noneAudioDestination);

          function AnalyserNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS;

            _classCallCheck(this, AnalyserNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS, options);
            var nativeAnalyserNode = createNativeAnalyserNode(nativeContext, mergedOptions);
            var analyserNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createAnalyserNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(AnalyserNode).call(this, context, nativeAnalyserNode, analyserNodeRenderer));
            _this._nativeAnalyserNode = nativeAnalyserNode;
            return _this;
          }

          _createClass(AnalyserNode, [{
            key: "getByteFrequencyData",
            value: function getByteFrequencyData(array) {
              this._nativeAnalyserNode.getByteFrequencyData(array);
            }
          }, {
            key: "getByteTimeDomainData",
            value: function getByteTimeDomainData(array) {
              this._nativeAnalyserNode.getByteTimeDomainData(array);
            }
          }, {
            key: "getFloatFrequencyData",
            value: function getFloatFrequencyData(array) {
              this._nativeAnalyserNode.getFloatFrequencyData(array);
            }
          }, {
            key: "getFloatTimeDomainData",
            value: function getFloatTimeDomainData(array) {
              this._nativeAnalyserNode.getFloatTimeDomainData(array);
            }
          }, {
            key: "fftSize",
            get: function get() {
              return this._nativeAnalyserNode.fftSize;
            },
            set: function set(value) {
              this._nativeAnalyserNode.fftSize = value;
            }
          }, {
            key: "frequencyBinCount",
            get: function get() {
              return this._nativeAnalyserNode.frequencyBinCount;
            }
          }, {
            key: "maxDecibels",
            get: function get() {
              return this._nativeAnalyserNode.maxDecibels;
            },
            set: function set(value) {
              this._nativeAnalyserNode.maxDecibels = value;
            }
          }, {
            key: "minDecibels",
            get: function get() {
              return this._nativeAnalyserNode.minDecibels;
            },
            set: function set(value) {
              this._nativeAnalyserNode.minDecibels = value;
            }
          }, {
            key: "smoothingTimeConstant",
            get: function get() {
              return this._nativeAnalyserNode.smoothingTimeConstant;
            },
            set: function set(value) {
              this._nativeAnalyserNode.smoothingTimeConstant = value;
            }
          }]);

          return AnalyserNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var getNativeAudioNode = function getNativeAudioNode(audioNode) {
      var nativeAudioNode = AUDIO_NODE_STORE.get(audioNode);

      if (nativeAudioNode === undefined) {
        throw new Error('The associated nativeAudioNode is missing.');
      }

      return nativeAudioNode;
    };

    var isOwnedByContext = function isOwnedByContext(nativeAudioNode, nativeContext) {
      // @todo The type definition of TypeScript wrongly defines the context property of an AudioNode as an AudioContext.
      // @todo https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts#L1415
      return nativeAudioNode.context === nativeContext;
    };

    function getAudioGraph(anyContext) {
      var audioGraph = AUDIO_GRAPHS.get(anyContext);

      if (audioGraph === undefined) {
        throw new Error('Missing the audio graph of the given context.');
      }

      return audioGraph;
    }

    var getAudioNodeConnections = function getAudioNodeConnections(anyAudioNode) {
      // The builtin types define the context property as BaseAudioContext which is why it needs to be casted here.
      var audioGraph = getAudioGraph(anyAudioNode.context);
      var audioNodeConnections = audioGraph.nodes.get(anyAudioNode);

      if (audioNodeConnections === undefined) {
        throw new Error('Missing the connections of the given AudioNode in the audio graph.');
      }

      return audioNodeConnections;
    };

    var getAudioNodeRenderer = function getAudioNodeRenderer(anyAudioNode) {
      var audioNodeConnections = getAudioNodeConnections(anyAudioNode);

      if (audioNodeConnections.renderer === null) {
        throw new Error('Missing the renderer of the given AudioNode in the audio graph.');
      }

      return audioNodeConnections.renderer;
    };

    var renderInputsOfAudioNode = function renderInputsOfAudioNode(audioNode, nativeOfflineAudioContext, nativeAudioNode) {
      var audioNodeConnections = getAudioNodeConnections(audioNode);
      return Promise.all(audioNodeConnections.inputs.map(function (connections, input) {
        return Array.from(connections.values()).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              source = _ref2[0],
              output = _ref2[1];

          return getAudioNodeRenderer(source).render(source, nativeOfflineAudioContext).then(function (node) {
            return node.connect(nativeAudioNode, output, input);
          });
        });
      }).reduce(function (allRenderingPromises, renderingPromises) {
        return _toConsumableArray(allRenderingPromises).concat(_toConsumableArray(renderingPromises));
      }, []));
    };

    var createAnalyserNodeRendererFactory = function createAnalyserNodeRendererFactory(createNativeAnalyserNode) {
      return function () {
        var nativeAnalyserNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeAnalyserNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeAnalyserNode);

                    case 2:
                      nativeAnalyserNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeAnalyserNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */

                      if (!isOwnedByContext(nativeAnalyserNode, nativeOfflineAudioContext)) {
                        options = {
                          channelCount: nativeAnalyserNode.channelCount,
                          channelCountMode: nativeAnalyserNode.channelCountMode,
                          channelInterpretation: nativeAnalyserNode.channelInterpretation,
                          fftSize: nativeAnalyserNode.fftSize,
                          maxDecibels: nativeAnalyserNode.maxDecibels,
                          minDecibels: nativeAnalyserNode.minDecibels,
                          smoothingTimeConstant: nativeAnalyserNode.smoothingTimeConstant
                        };
                        nativeAnalyserNode = createNativeAnalyserNode(nativeOfflineAudioContext, options);
                      }

                      _context.next = 6;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAnalyserNode);

                    case 6:
                      return _context.abrupt("return", nativeAnalyserNode);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var ONGOING_TESTS = new Map();

    function cacheTestResult(tester, test) {
      var cachedTestResult = TEST_RESULTS.get(tester);

      if (cachedTestResult !== undefined) {
        return cachedTestResult;
      }

      var ongoingTest = ONGOING_TESTS.get(tester);

      if (ongoingTest !== undefined) {
        return ongoingTest;
      }

      var synchronousTestResult = test();

      if (synchronousTestResult instanceof Promise) {
        ONGOING_TESTS.set(tester, synchronousTestResult);
        return synchronousTestResult.then(function (finalTestResult) {
          ONGOING_TESTS.delete(tester);
          TEST_RESULTS.set(tester, finalTestResult);
          return finalTestResult;
        });
      }

      TEST_RESULTS.set(tester, synchronousTestResult);
      return synchronousTestResult;
    }

    var testAudioBufferCopyChannelMethodsSubarraySupport = function testAudioBufferCopyChannelMethodsSubarraySupport(nativeAudioBuffer) {
      var source = new Float32Array(2);

      try {
        /*
         * Only Firefox does not fully support the copyFromChannel() and copyToChannel() methods. Therefore testing one of those
         * methods is enough to know if the other one it supported as well.
         */
        nativeAudioBuffer.copyToChannel(source, 0, nativeAudioBuffer.length - 1);
      } catch (_a) {
        return false;
      }

      return true;
    };

    var createIndexSizeError = function createIndexSizeError() {
      try {
        return new DOMException('', 'IndexSizeError');
      } catch (err) {
        err.code = 1;
        err.name = 'IndexSizeError';
        return err;
      }
    };

    var wrapAudioBufferCopyChannelMethods = function wrapAudioBufferCopyChannelMethods(audioBuffer) {
      audioBuffer.copyFromChannel = function (destination, channelNumber) {
        var startInChannel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (channelNumber >= audioBuffer.numberOfChannels || startInChannel >= audioBuffer.length) {
          throw createIndexSizeError();
        }

        var channelData = audioBuffer.getChannelData(channelNumber);
        var channelLength = channelData.length;
        var destinationLength = destination.length;

        for (var i = 0; i + startInChannel < channelLength && i < destinationLength; i += 1) {
          destination[i] = channelData[i + startInChannel];
        }
      };

      audioBuffer.copyToChannel = function (source, channelNumber) {
        var startInChannel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (channelNumber >= audioBuffer.numberOfChannels || startInChannel >= audioBuffer.length) {
          throw createIndexSizeError();
        }

        var channelData = audioBuffer.getChannelData(channelNumber);
        var channelLength = channelData.length;
        var sourceLength = source.length;

        for (var i = 0; i + startInChannel < channelLength && i < sourceLength; i += 1) {
          channelData[i + startInChannel] = source[i];
        }
      };
    };

    var wrapAudioBufferCopyChannelMethodsSubarray = function wrapAudioBufferCopyChannelMethodsSubarray(audioBuffer) {
      audioBuffer.copyFromChannel = function (copyFromChannel) {
        return function (destination, channelNumber) {
          var startInChannel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

          if (channelNumber >= audioBuffer.numberOfChannels || startInChannel >= audioBuffer.length) {
            throw createIndexSizeError();
          }

          if (startInChannel < audioBuffer.length && audioBuffer.length - startInChannel < destination.length) {
            return copyFromChannel.call(audioBuffer, destination.subarray(0, audioBuffer.length - startInChannel), channelNumber, startInChannel);
          }

          return copyFromChannel.call(audioBuffer, destination, channelNumber, startInChannel);
        };
      }(audioBuffer.copyFromChannel);

      audioBuffer.copyToChannel = function (copyToChannel) {
        return function (source, channelNumber) {
          var startInChannel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

          if (channelNumber >= audioBuffer.numberOfChannels || startInChannel >= audioBuffer.length) {
            throw createIndexSizeError();
          }

          if (startInChannel < audioBuffer.length && audioBuffer.length - startInChannel < source.length) {
            return copyToChannel.call(audioBuffer, source.subarray(0, audioBuffer.length - startInChannel), channelNumber, startInChannel);
          }

          return copyToChannel.call(audioBuffer, source, channelNumber, startInChannel);
        };
      }(audioBuffer.copyToChannel);
    };

    var wrapAudioBufferGetChannelDataMethod = function wrapAudioBufferGetChannelDataMethod(audioBuffer) {
      audioBuffer.getChannelData = function (getChannelData) {
        return function (channel) {
          try {
            return getChannelData.call(audioBuffer, channel);
          } catch (err) {
            if (err.code === 12) {
              throw createIndexSizeError();
            }

            throw err; // tslint:disable-line:rxjs-throw-error
          }
        };
      }(audioBuffer.getChannelData);
    };

    var DEFAULT_OPTIONS$1 = {
      numberOfChannels: 1
    };
    var createAudioBufferConstructor = function createAudioBufferConstructor(createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, testNativeAudioBufferConstructorSupport) {
      var nativeOfflineAudioContext = null;
      return (
        /*#__PURE__*/
        function () {
          function AudioBuffer(options) {
            _classCallCheck(this, AudioBuffer);

            if (nativeOfflineAudioContextConstructor === null) {
              throw new Error(); // @todo
            }

            var _Object$assign = Object.assign({}, DEFAULT_OPTIONS$1, options),
                length = _Object$assign.length,
                numberOfChannels = _Object$assign.numberOfChannels,
                sampleRate = _Object$assign.sampleRate;

            if (nativeOfflineAudioContext === null) {
              nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
            }
            /*
             * Bug #99: Firefox does not throw a NotSupportedError when the numberOfChannels is zero. But it only does it when using the
             * factory function. But since Firefox also supports the constructor everything should be fine.
             */


            var audioBuffer = nativeAudioBufferConstructor !== null && cacheTestResult(testNativeAudioBufferConstructorSupport, function () {
              return testNativeAudioBufferConstructorSupport();
            }) ? new nativeAudioBufferConstructor({
              length: length,
              numberOfChannels: numberOfChannels,
              sampleRate: sampleRate
            }) : nativeOfflineAudioContext.createBuffer(numberOfChannels, length, sampleRate); // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
            // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.

            if (typeof audioBuffer.copyFromChannel !== 'function') {
              wrapAudioBufferCopyChannelMethods(audioBuffer);
              wrapAudioBufferGetChannelDataMethod(audioBuffer); // Bug #42: Firefox does not yet fully support copyFromChannel() and copyToChannel().
            } else if (!cacheTestResult(testAudioBufferCopyChannelMethodsSubarraySupport, function () {
              return testAudioBufferCopyChannelMethodsSubarraySupport(audioBuffer);
            })) {
              wrapAudioBufferCopyChannelMethodsSubarray(audioBuffer);
            } // Bug #99: Safari does not throw an error when the numberOfChannels is zero.


            if (audioBuffer.numberOfChannels === 0) {
              throw createNotSupportedError();
            }
            /*
             * This does violate all good pratices but it is necessary to allow this AudioBuffer to be used with native
             * (Offline)AudioContexts.
             */


            return audioBuffer;
          } // This method needs to be defined to convince TypeScript that the IAudioBuffer will be implemented.


          _createClass(AudioBuffer, [{
            key: "copyFromChannel",
            value: function copyFromChannel(_1, _2) {
            } // tslint:disable-line:no-empty
            // This method needs to be defined to convince TypeScript that the IAudioBuffer will be implemented.

          }, {
            key: "copyToChannel",
            value: function copyToChannel(_1, _2) {
            } // tslint:disable-line:no-empty
            // This method needs to be defined to convince TypeScript that the IAudioBuffer will be implemented.

          }, {
            key: "getChannelData",
            value: function getChannelData(_) {
              return new Float32Array(0);
            }
          }]);

          return AudioBuffer;
        }()
      );
    };

    var DEFAULT_OPTIONS$2 = {
      buffer: null,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      detune: 0,
      loop: false,
      loopEnd: 0,
      loopStart: 0,
      playbackRate: 1
    };
    var createAudioBufferSourceNodeConstructor = function createAudioBufferSourceNodeConstructor(createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(AudioBufferSourceNode, _noneAudioDestination);

          function AudioBufferSourceNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$2;

            _classCallCheck(this, AudioBufferSourceNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$2, options);
            var nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var audioBufferSourceNodeRenderer = isOffline ? createAudioBufferSourceNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(AudioBufferSourceNode).call(this, context, nativeAudioBufferSourceNode, audioBufferSourceNodeRenderer));
            _this._audioBufferSourceNodeRenderer = audioBufferSourceNodeRenderer;
            _this._detune = createAudioParam(context, isOffline, nativeAudioBufferSourceNode.detune);
            _this._isBufferNullified = false;
            _this._isBufferSet = false;
            _this._nativeAudioBufferSourceNode = nativeAudioBufferSourceNode; // Bug #73: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._playbackRate = createAudioParam(context, isOffline, nativeAudioBufferSourceNode.playbackRate, 3.4028234663852886e38, -3.4028234663852886e38);
            return _this;
          }

          _createClass(AudioBufferSourceNode, [{
            key: "start",
            value: function start() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
              var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
              var duration = arguments.length > 2 ? arguments[2] : undefined;

              this._nativeAudioBufferSourceNode.start(when, offset, duration);

              if (this._audioBufferSourceNodeRenderer !== null) {
                this._audioBufferSourceNodeRenderer.start = duration === undefined ? [when, offset] : [when, offset, duration];
              }
            }
          }, {
            key: "stop",
            value: function stop() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              this._nativeAudioBufferSourceNode.stop(when);

              if (this._audioBufferSourceNodeRenderer !== null) {
                this._audioBufferSourceNodeRenderer.stop = when;
              }
            }
          }, {
            key: "buffer",
            get: function get() {
              if (this._isBufferNullified) {
                return null;
              }

              return this._nativeAudioBufferSourceNode.buffer;
            },
            set: function set(value) {
              // Bug #71: Edge does not allow to set the buffer to null.
              try {
                this._nativeAudioBufferSourceNode.buffer = value;
              } catch (err) {
                if (value !== null || err.code !== 17) {
                  throw err; // tslint:disable-line:rxjs-throw-error
                } // @todo Create a new internal nativeAudioBufferSourceNode.


                this._isBufferNullified = this._nativeAudioBufferSourceNode.buffer !== null;
              } // Bug #72: Only Chrome, Edge & Opera do not allow to reassign the buffer yet.


              if (value !== null) {
                if (this._isBufferSet) {
                  throw createInvalidStateError();
                }

                this._isBufferSet = true;
              }
            }
          }, {
            key: "onended",
            get: function get() {
              return this._nativeAudioBufferSourceNode.onended;
            },
            set: function set(value) {
              this._nativeAudioBufferSourceNode.onended = value;
            }
          }, {
            key: "detune",
            get: function get() {
              return this._detune;
            }
          }, {
            key: "loop",
            get: function get() {
              return this._nativeAudioBufferSourceNode.loop;
            },
            set: function set(value) {
              this._nativeAudioBufferSourceNode.loop = value;
            }
          }, {
            key: "loopEnd",
            get: function get() {
              return this._nativeAudioBufferSourceNode.loopEnd;
            },
            set: function set(value) {
              this._nativeAudioBufferSourceNode.loopEnd = value;
            }
          }, {
            key: "loopStart",
            get: function get() {
              return this._nativeAudioBufferSourceNode.loopStart;
            },
            set: function set(value) {
              this._nativeAudioBufferSourceNode.loopStart = value;
            }
          }, {
            key: "playbackRate",
            get: function get() {
              return this._playbackRate;
            }
          }]);

          return AudioBufferSourceNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createAudioBufferSourceNodeRendererFactory = function createAudioBufferSourceNodeRendererFactory(createNativeAudioBufferSourceNode) {
      return function () {
        var nativeAudioBufferSourceNode = null;
        var start = null;
        var stop = null;
        return {
          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options, _nativeAudioBufferSou;

              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeAudioBufferSourceNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeAudioBufferSourceNode);

                    case 2:
                      nativeAudioBufferSourceNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeAudioBufferSourceNode was not constructed on the same OfflineAudioContext it needs to be
                       * created again.
                       */

                      if (!isOwnedByContext(nativeAudioBufferSourceNode, nativeOfflineAudioContext)) {
                        options = {
                          buffer: nativeAudioBufferSourceNode.buffer,
                          channelCount: nativeAudioBufferSourceNode.channelCount,
                          channelCountMode: nativeAudioBufferSourceNode.channelCountMode,
                          channelInterpretation: nativeAudioBufferSourceNode.channelInterpretation,
                          detune: 0,
                          loop: nativeAudioBufferSourceNode.loop,
                          loopEnd: nativeAudioBufferSourceNode.loopEnd,
                          loopStart: nativeAudioBufferSourceNode.loopStart,
                          playbackRate: nativeAudioBufferSourceNode.playbackRate.value
                        };
                        nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, options);

                        if (start !== null) {
                          (_nativeAudioBufferSou = nativeAudioBufferSourceNode).start.apply(_nativeAudioBufferSou, _toConsumableArray(start));
                        }

                        if (stop !== null) {
                          nativeAudioBufferSourceNode.stop(stop);
                        }
                      }

                      _context.next = 6;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioBufferSourceNode);

                    case 6:
                      return _context.abrupt("return", nativeAudioBufferSourceNode);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var isValidLatencyHint = function isValidLatencyHint(latencyHint) {
      return latencyHint === undefined || typeof latencyHint === 'number' || typeof latencyHint === 'string' && (latencyHint === 'balanced' || latencyHint === 'interactive' || latencyHint === 'playback');
    };

    var createAudioContextConstructor = function createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioSourceNodeConstructor, nativeAudioContextConstructor) {
      return (
        /*#__PURE__*/
        function (_baseAudioContextCons) {
          _inherits(AudioContext, _baseAudioContextCons);

          function AudioContext() {
            var _this;

            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            _classCallCheck(this, AudioContext);

            if (nativeAudioContextConstructor === null) {
              throw new Error(); // @todo
            }

            var nativeAudioContext = new nativeAudioContextConstructor(options); // Bug #51 Only Chrome and Opera throw an error if the given latencyHint is invalid.

            if (!isValidLatencyHint(options.latencyHint)) {
              throw new TypeError("The provided value '".concat(options.latencyHint, "' is not a valid enum value of type AudioContextLatencyCategory."));
            }

            _this = _possibleConstructorReturn(this, _getPrototypeOf(AudioContext).call(this, nativeAudioContext, nativeAudioContext.destination.channelCount));
            _this._state = null;
            _this._nativeAudioContext = nativeAudioContext;
            /*
             * Bug #34: Chrome and Opera pretend to be running right away, but fire an onstatechange event when the state actually changes
             * to 'running'.
             */

            if (nativeAudioContext.state === 'running') {
              _this._state = 'suspended';

              var revokeState = function revokeState() {
                if (_this._state === 'suspended') {
                  _this._state = null;
                }

                if (nativeAudioContext.removeEventListener) {
                  nativeAudioContext.removeEventListener('statechange', revokeState);
                }
              };

              nativeAudioContext.addEventListener('statechange', revokeState);
            }

            return _this;
          }

          _createClass(AudioContext, [{
            key: "close",
            value: function close() {
              // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
              if (this.state === 'closed') {
                return this._nativeAudioContext.close().then(function () {
                  throw createInvalidStateError();
                });
              } // Bug #34: If the state was set to suspended before it should be revoked now.


              if (this._state === 'suspended') {
                this._state = null;
              }

              return this._nativeAudioContext.close();
              /*
               * Bug #50: Deleting the AudioGraph is currently not possible anymore.
               * ...then(() => deleteAudioGraph(this, this._nativeAudioContext));
               */
            }
          }, {
            key: "createMediaElementSource",
            value: function createMediaElementSource(mediaElement) {
              return new mediaElementAudioSourceNodeConstructor(this, {
                mediaElement: mediaElement
              });
            }
          }, {
            key: "createMediaStreamSource",
            value: function createMediaStreamSource(mediaStream) {
              return new mediaStreamAudioSourceNodeConstructor(this, {
                mediaStream: mediaStream
              });
            }
          }, {
            key: "resume",
            value: function resume() {
              return this._nativeAudioContext.resume().catch(function (err) {
                // Bug #55: Chrome, Edge and Opera do throw an InvalidAccessError instead of an InvalidStateError.
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined || err.code === 15) {
                  throw createInvalidStateError();
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "suspend",
            value: function suspend() {
              return this._nativeAudioContext.suspend().catch(function (err) {
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined) {
                  throw createInvalidStateError();
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "state",
            get: function get() {
              return this._state !== null ? this._state : this._nativeAudioContext.state;
            }
          }]);

          return AudioContext;
        }(baseAudioContextConstructor)
      );
    };

    var createAudioDestinationNodeConstructor = function createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNode, isNativeOfflineAudioContext) {
      return (
        /*#__PURE__*/
        function (_audioNodeConstructor) {
          _inherits(AudioDestinationNode, _audioNodeConstructor);

          function AudioDestinationNode(context, channelCount) {
            var _this;

            _classCallCheck(this, AudioDestinationNode);

            var nativeContext = getNativeContext(context);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var nativeAudioDestinationNode = createNativeAudioDestinationNode(nativeContext, channelCount, isOffline);
            var audioDestinationNodeRenderer = isOffline ? createAudioDestinationNodeRenderer() : null;
            var audioGraph = {
              audioWorkletGlobalScope: null,
              nodes: new WeakMap(),
              params: new WeakMap()
            };
            AUDIO_GRAPHS.set(context, audioGraph);
            AUDIO_GRAPHS.set(nativeContext, audioGraph);
            _this = _possibleConstructorReturn(this, _getPrototypeOf(AudioDestinationNode).call(this, context, nativeAudioDestinationNode, audioDestinationNodeRenderer));
            _this._isNodeOfNativeOfflineAudioContext = isOffline;
            _this._nativeAudioDestinationNode = nativeAudioDestinationNode;
            return _this;
          }

          _createClass(AudioDestinationNode, [{
            key: "channelCount",
            get: function get() {
              return this._nativeAudioDestinationNode.channelCount;
            },
            set: function set(value) {
              // Bug #52: Chrome, Edge, Opera & Safari do not throw an exception at all.
              // Bug #54: Firefox does throw an IndexSizeError.
              if (this._isNodeOfNativeOfflineAudioContext) {
                throw createInvalidStateError();
              } // Bug #47: The AudioDestinationNode in Edge and Safari do not initialize the maxChannelCount property correctly.


              if (value > this._nativeAudioDestinationNode.maxChannelCount) {
                throw createIndexSizeError();
              }

              this._nativeAudioDestinationNode.channelCount = value;
            }
          }, {
            key: "channelCountMode",
            get: function get() {
              return this._nativeAudioDestinationNode.channelCountMode;
            },
            set: function set(value) {
              // Bug #53: No browser does throw an exception yet.
              if (this._isNodeOfNativeOfflineAudioContext) {
                throw createInvalidStateError();
              }

              this._nativeAudioDestinationNode.channelCountMode = value;
            }
          }, {
            key: "maxChannelCount",
            get: function get() {
              return this._nativeAudioDestinationNode.maxChannelCount;
            }
          }]);

          return AudioDestinationNode;
        }(audioNodeConstructor)
      );
    };

    var createAudioDestinationNodeRenderer = function createAudioDestinationNodeRenderer() {
      var nativeAudioDestinationNode = null;
      return {
        render: function () {
          var _render = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!(nativeAudioDestinationNode !== null)) {
                      _context.next = 2;
                      break;
                    }

                    return _context.abrupt("return", nativeAudioDestinationNode);

                  case 2:
                    nativeAudioDestinationNode = nativeOfflineAudioContext.destination;
                    _context.next = 5;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioDestinationNode);

                  case 5:
                    return _context.abrupt("return", nativeAudioDestinationNode);

                  case 6:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          return function render(_x, _x2) {
            return _render.apply(this, arguments);
          };
        }()
      };
    };

    var EventTarget =
    /*#__PURE__*/
    function () {
      function EventTarget() {
        _classCallCheck(this, EventTarget);
      }

      _createClass(EventTarget, [{
        key: "addEventListener",
        value: function addEventListener(type, listener, // @todo EventListenerOrEventListenerObject | null = null,
        options) {
        }
      }, {
        key: "dispatchEvent",
        value: function dispatchEvent(evt) {

          return false;
        }
      }, {
        key: "removeEventListener",
        value: function removeEventListener(type, listener, // @todo EventListenerOrEventListenerObject | null = null,
        options) {
        }
      }]);

      return EventTarget;
    }();

    var isAudioNode = function isAudioNode(audioNodeOrAudioParam) {
      return audioNodeOrAudioParam.context !== undefined;
    };

    function getAudioParamConnections(anyContext, audioParam) {
      var audioGraph = getAudioGraph(anyContext);
      var audioParamConnections = audioGraph.params.get(audioParam);

      if (audioParamConnections === undefined) {
        throw new Error('Missing the connections of the given AudioParam in the audio graph.');
      }

      return audioParamConnections;
    }

    var getNativeAudioParam = function getNativeAudioParam(audioParam) {
      var nativeAudioParam = AUDIO_PARAM_STORE.get(audioParam);

      if (nativeAudioParam === undefined) {
        throw new Error('The associated nativeAudioParam is missing.');
      }

      return nativeAudioParam;
    };

    var testAudioNodeDisconnectMethodSupport = function testAudioNodeDisconnectMethodSupport(nativeAudioContext) {
      return new Promise(function (resolve) {
        var analyzer = nativeAudioContext.createScriptProcessor(256, 1, 1);
        var dummy = nativeAudioContext.createGain(); // Bug #95: Safari does not play one sample buffers.

        var ones = nativeAudioContext.createBuffer(1, 2, 44100);
        var channelData = ones.getChannelData(0);
        channelData[0] = 1;
        channelData[1] = 1;
        var source = nativeAudioContext.createBufferSource();
        source.buffer = ones;
        source.loop = true;
        source.connect(analyzer);
        analyzer.connect(nativeAudioContext.destination);
        source.connect(dummy);
        source.disconnect(dummy);

        analyzer.onaudioprocess = function (event) {
          var chnnlDt = event.inputBuffer.getChannelData(0);

          if (Array.prototype.some.call(chnnlDt, function (sample) {
            return sample === 1;
          })) {
            resolve(true);
          } else {
            resolve(false);
          }

          source.stop();
          analyzer.onaudioprocess = null;
          source.disconnect(analyzer);
          analyzer.disconnect(nativeAudioContext.destination);
        };

        source.start();
      });
    };

    var wrapAudioNodeDisconnectMethod = function wrapAudioNodeDisconnectMethod(nativeAudioNode) {
      var destinations = new Map();

      nativeAudioNode.connect = function (connect) {
        return function (destination) {
          var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
          destinations.set(destination, {
            input: input,
            output: output
          });

          if (destination instanceof AudioNode) {
            return connect.call(nativeAudioNode, destination, output, input);
          }

          return connect.call(nativeAudioNode, destination, output);
        };
      }(nativeAudioNode.connect);

      nativeAudioNode.disconnect = function (disconnect) {
        return function (outputOrDestination, _output, _input) {
          disconnect.apply(nativeAudioNode);

          if (outputOrDestination === undefined) {
            destinations.clear();
          } else if (destinations.has(outputOrDestination)) {
            destinations.delete(outputOrDestination);
            destinations.forEach(function (_ref, dstntn) {
              var input = _ref.input,
                  output = _ref.output;
              nativeAudioNode.connect(dstntn, input, output);
            });
          }
        };
      }(nativeAudioNode.disconnect);
    };

    var addAudioNode = function addAudioNode(context, audioNode, audioNoderRender, nativeAudioNode) {
      var audioGraph = getAudioGraph(context);
      var inputs = [];

      for (var i = 0; i < nativeAudioNode.numberOfInputs; i += 1) {
        inputs.push(new Set());
      }

      var audioNodeConnections = {
        inputs: inputs,
        outputs: new Set(),
        renderer: audioNoderRender
      };
      audioGraph.nodes.set(audioNode, audioNodeConnections);
      audioGraph.nodes.set(nativeAudioNode, audioNodeConnections);
    };

    var addConnectionToAudioNode = function addConnectionToAudioNode(source, destination, output, input) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);
      var audioNodeConnectionsOfDestination = getAudioNodeConnections(destination);
      audioNodeConnectionsOfSource.outputs.add([destination, output, input]);
      audioNodeConnectionsOfDestination.inputs[input].add([source, output]);
    };

    var addConnectionToAudioParam = function addConnectionToAudioParam(context, source, destination, output) {
      var audioNodeConnections = getAudioNodeConnections(source);
      var audioParamConnections = getAudioParamConnections(context, destination);
      audioNodeConnections.outputs.add([destination, output]);
      audioParamConnections.inputs.add([source, output]);
    };

    var removeAnyConnection = function removeAnyConnection(source) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);

      var _arr = Array.from(audioNodeConnectionsOfSource.outputs.values());

      for (var _i = 0; _i < _arr.length; _i++) {
        var _arr$_i = _slicedToArray(_arr[_i], 1),
            destination = _arr$_i[0];

        if (isAudioNode(destination)) {
          var audioNodeConnectionsOfDestination = getAudioNodeConnections(destination);
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = audioNodeConnectionsOfDestination.inputs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var connectionsToInput = _step.value;

              var _arr2 = Array.from(connectionsToInput.values());

              for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                var connection = _arr2[_i2];

                if (connection[0] === source) {
                  connectionsToInput.delete(connection);
                }
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }

      audioNodeConnectionsOfSource.outputs.clear();
    };

    var removeConnectionToAudioNode = function removeConnectionToAudioNode(source, destination) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);
      var audioNodeConnectionsOfDestination = getAudioNodeConnections(destination);

      var _arr3 = Array.from(audioNodeConnectionsOfSource.outputs.values());

      for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
        var connection = _arr3[_i3];

        if (connection[0] === destination) {
          audioNodeConnectionsOfSource.outputs.delete(connection);
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = audioNodeConnectionsOfDestination.inputs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var connectionsToInput = _step2.value;

          var _arr4 = Array.from(connectionsToInput.values());

          for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
            var _connection = _arr4[_i4];

            if (_connection[0] === source) {
              connectionsToInput.delete(_connection);
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    };

    var createAudioNodeConstructor = function createAudioNodeConstructor(createInvalidAccessError, isNativeOfflineAudioContext) {
      return (
        /*#__PURE__*/
        function (_EventTarget) {
          _inherits(AudioNode, _EventTarget);

          function AudioNode(context, nativeAudioNode, audioNodeRenderer) {
            var _this;

            _classCallCheck(this, AudioNode);

            _this = _possibleConstructorReturn(this, _getPrototypeOf(AudioNode).call(this));
            _this._context = context;
            _this._nativeAudioNode = nativeAudioNode;
            var nativeContext = getNativeContext(context); // Bug #12: Firefox and Safari do not support to disconnect a specific destination.
            // @todo Make sure this is not used with an OfflineAudioContext.

            if (!isNativeOfflineAudioContext(nativeContext) && true !== cacheTestResult(testAudioNodeDisconnectMethodSupport, function () {
              return testAudioNodeDisconnectMethodSupport(nativeContext);
            })) {
              wrapAudioNodeDisconnectMethod(nativeAudioNode);
            }

            AUDIO_NODE_STORE.set(_assertThisInitialized(_assertThisInitialized(_this)), nativeAudioNode);
            addAudioNode(context, _assertThisInitialized(_assertThisInitialized(_this)), audioNodeRenderer, nativeAudioNode);
            return _this;
          }

          _createClass(AudioNode, [{
            key: "addEventListener",
            value: function addEventListener(type, listener, // @todo EventListenerOrEventListenerObject | null = null,
            options) {
              return this._nativeAudioNode.addEventListener(type, listener, options);
            }
          }, {
            key: "connect",
            value: function connect(destination) {
              var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
              var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
              var nativeContext = getNativeContext(this._context);

              if (isAudioNode(destination)) {
                // Bug #41: Only Chrome, Firefox and Opera throw the correct exception by now.
                if (this._context !== destination.context) {
                  throw createInvalidAccessError();
                }

                if (!isNativeOfflineAudioContext(nativeContext)) {
                  var nativeDestinationNode = getNativeAudioNode(destination);

                  if (nativeDestinationNode.inputs !== undefined) {
                    var inputs = nativeDestinationNode.inputs;
                    var nativeInputDestinationNode = inputs[input];

                    this._nativeAudioNode.connect(nativeInputDestinationNode, output, input);
                  } else {
                    this._nativeAudioNode.connect(nativeDestinationNode, output, input);
                  }
                }

                addConnectionToAudioNode(this, destination, output, input);
                return destination;
              }

              var nativeAudioParam = getNativeAudioParam(destination);

              try {
                this._nativeAudioNode.connect(nativeAudioParam, output); // @todo Calling connect() is only needed to throw possible errors when the nativeContext is an OfflineAudioContext.


                if (isNativeOfflineAudioContext(nativeContext)) {
                  this._nativeAudioNode.disconnect(nativeAudioParam, output);
                }
              } catch (err) {
                // Bug #58: Only Firefox does throw an InvalidStateError yet.
                if (err.code === 12) {
                  throw createInvalidAccessError();
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              }

              addConnectionToAudioParam(this._context, this, destination, output);
            }
          }, {
            key: "disconnect",
            value: function disconnect(destination) {
              var nativeContext = getNativeContext(this._context);

              if (!isNativeOfflineAudioContext(nativeContext)) {
                if (destination === undefined) {
                  return this._nativeAudioNode.disconnect();
                }

                var nativeDestinationNode = getNativeAudioNode(destination);

                if (nativeDestinationNode.inputs !== undefined) {
                  var _iteratorNormalCompletion3 = true;
                  var _didIteratorError3 = false;
                  var _iteratorError3 = undefined;

                  try {
                    for (var _iterator3 = nativeDestinationNode.inputs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                      var input = _step3.value;

                      this._nativeAudioNode.disconnect(input);
                    }
                  } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
                        _iterator3.return();
                      }
                    } finally {
                      if (_didIteratorError3) {
                        throw _iteratorError3;
                      }
                    }
                  }
                } else {
                  this._nativeAudioNode.disconnect(nativeDestinationNode);
                }
              }

              if (destination === undefined) {
                removeAnyConnection(this);
              } else {
                removeConnectionToAudioNode(this, destination);
              }
            }
          }, {
            key: "removeEventListener",
            value: function removeEventListener(type, listener, // @todo EventListenerOrEventListenerObject | null = null,
            options) {
              return this._nativeAudioNode.removeEventListener(type, listener, options);
            }
          }, {
            key: "channelCount",
            get: function get() {
              return this._nativeAudioNode.channelCount;
            },
            set: function set(value) {
              this._nativeAudioNode.channelCount = value;
            }
          }, {
            key: "channelCountMode",
            get: function get() {
              return this._nativeAudioNode.channelCountMode;
            },
            set: function set(value) {
              this._nativeAudioNode.channelCountMode = value;
            }
          }, {
            key: "channelInterpretation",
            get: function get() {
              return this._nativeAudioNode.channelInterpretation;
            },
            set: function set(value) {
              this._nativeAudioNode.channelInterpretation = value;
            }
          }, {
            key: "context",
            get: function get() {
              return this._context;
            }
          }, {
            key: "numberOfInputs",
            get: function get() {
              return this._nativeAudioNode.numberOfInputs;
            }
          }, {
            key: "numberOfOutputs",
            get: function get() {
              return this._nativeAudioNode.numberOfOutputs;
            }
          }]);

          return AudioNode;
        }(EventTarget)
      );
    };

    var addAudioParam = function addAudioParam(context, audioParam, audioParamRenderer) {
      var audioGraph = getAudioGraph(context);
      audioGraph.params.set(audioParam, {
        inputs: new Set(),
        renderer: audioParamRenderer
      });
    };

    var createAudioParamFactory = function createAudioParamFactory(createAudioParamRenderer) {
      return function (context, isAudioParamOfOfflineAudioContext, nativeAudioParam) {
        var maxValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        var minValue = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var audioParamRenderer = isAudioParamOfOfflineAudioContext ? createAudioParamRenderer() : null;
        var audioParam = {
          get defaultValue() {
            return nativeAudioParam.defaultValue;
          },

          get maxValue() {
            return maxValue === null ? nativeAudioParam.maxValue : maxValue;
          },

          get minValue() {
            return minValue === null ? nativeAudioParam.minValue : minValue;
          },

          get value() {
            return nativeAudioParam.value;
          },

          set value(value) {
            nativeAudioParam.value = value; // Bug #98: Edge, Firefox & Safari do not yet treat the value setter like a call to setValueAtTime().

            audioParam.setValueAtTime(value, context.currentTime);
          },

          cancelScheduledValues: function cancelScheduledValues(cancelTime) {
            nativeAudioParam.cancelScheduledValues(cancelTime); // @todo

            return audioParam;
          },
          exponentialRampToValueAtTime: function exponentialRampToValueAtTime(value, endTime) {
            nativeAudioParam.exponentialRampToValueAtTime(value, endTime);

            if (audioParamRenderer !== null) {
              audioParamRenderer.record({
                endTime: endTime,
                type: 'exponentialRampToValue',
                value: value
              });
            }

            return audioParam;
          },
          linearRampToValueAtTime: function linearRampToValueAtTime(value, endTime) {
            nativeAudioParam.linearRampToValueAtTime(value, endTime);

            if (audioParamRenderer !== null) {
              audioParamRenderer.record({
                endTime: endTime,
                type: 'linearRampToValue',
                value: value
              });
            }

            return audioParam;
          },
          setTargetAtTime: function setTargetAtTime(target, startTime, timeConstant) {
            nativeAudioParam.setTargetAtTime(target, startTime, timeConstant);

            if (audioParamRenderer !== null) {
              audioParamRenderer.record({
                startTime: startTime,
                target: target,
                timeConstant: timeConstant,
                type: 'setTarget'
              });
            }

            return audioParam;
          },
          setValueAtTime: function setValueAtTime(value, startTime) {
            nativeAudioParam.setValueAtTime(value, startTime);

            if (audioParamRenderer !== null) {
              audioParamRenderer.record({
                startTime: startTime,
                type: 'setValue',
                value: value
              });
            }

            return audioParam;
          },
          setValueCurveAtTime: function setValueCurveAtTime(values, startTime, duration) {
            // @todo TypeScript is expecting values to be an array of numbers.
            nativeAudioParam.setValueCurveAtTime(values, startTime, duration);

            if (audioParamRenderer !== null) {
              audioParamRenderer.record({
                duration: duration,
                startTime: startTime,
                type: 'setValueCurve',
                values: values
              });
            }

            return audioParam;
          }
        };
        AUDIO_PARAM_STORE.set(audioParam, nativeAudioParam);
        addAudioParam(context, audioParam, audioParamRenderer);
        return audioParam;
      };
    };

    var createAudioParamRenderer = function createAudioParamRenderer() {
      var automations = [];
      return {
        record: function record(automation) {
          automations.push(automation);
        },
        replay: function replay(audioParam) {
          for (var _i = 0; _i < automations.length; _i++) {
            var automation = automations[_i];

            if (automation.type === 'exponentialRampToValue') {
              var endTime = automation.endTime,
                  value = automation.value;
              audioParam.exponentialRampToValueAtTime(value, endTime);
            } else if (automation.type === 'linearRampToValue') {
              var _endTime = automation.endTime,
                  _value = automation.value;
              audioParam.linearRampToValueAtTime(_value, _endTime);
            } else if (automation.type === 'setTarget') {
              var startTime = automation.startTime,
                  target = automation.target,
                  timeConstant = automation.timeConstant;
              audioParam.setTargetAtTime(target, startTime, timeConstant);
            } else if (automation.type === 'setValue') {
              var _startTime = automation.startTime,
                  _value2 = automation.value;
              audioParam.setValueAtTime(_value2, _startTime);
            } else if (automation.type === 'setValueCurve') {
              var duration = automation.duration,
                  _startTime2 = automation.startTime,
                  values = automation.values; // @todo TypeScript is expecting values to be an array of numbers.

              audioParam.setValueCurveAtTime(values, _startTime2, duration);
            } else {
              throw new Error("Can't apply an unkown automation.");
            }
          }
        }
      };
    };

    var ReadOnlyMap =
    /*#__PURE__*/
    function () {
      function ReadOnlyMap(parameters) {
        _classCallCheck(this, ReadOnlyMap);

        this._map = new Map(parameters);
      }

      _createClass(ReadOnlyMap, [{
        key: "entries",
        value: function entries() {
          return this._map.entries();
        }
      }, {
        key: "forEach",
        value: function forEach(callback) {
          var _this = this;

          var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
          return this._map.forEach(function (value, key) {
            return callback.call(thisArg, value, key, _this);
          });
        }
      }, {
        key: "get",
        value: function get(name) {
          return this._map.get(name);
        }
      }, {
        key: "has",
        value: function has(name) {
          return this._map.has(name);
        }
      }, {
        key: "keys",
        value: function keys() {
          return this._map.keys();
        }
      }, {
        key: "values",
        value: function values() {
          return this._map.values();
        }
      }, {
        key: "size",
        get: function get() {
          return this._map.size;
        }
      }]);

      return ReadOnlyMap;
    }();

    var DEFAULT_OPTIONS$3 = {
      channelCount: 2,
      // Bug #61: The channelCountMode should be 'max' according to the spec but is set to 'explicit' to achieve consistent behavior.
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: undefined,
      parameterData: {},
      processorOptions: null
    };

    var createChannelCount = function createChannelCount(length) {
      var channelCount = [];

      for (var i = 0; i < length; i += 1) {
        channelCount.push(1);
      }

      return channelCount;
    };

    var sanitizedOptions = function sanitizedOptions(options) {
      return Object.assign({}, options, {
        outputChannelCount: options.outputChannelCount !== undefined ? options.outputChannelCount : options.numberOfInputs === 1 && options.numberOfOutputs === 1 ?
        /*
         * Bug #61: This should be the computedNumberOfChannels, but unfortunately that is almost impossible to fake. That's why
         * the channelCountMode is required to be 'explicit' as long as there is not a native implementation in every browser. That
         * makes sure the computedNumberOfChannels is equivilant to the channelCount which makes it much easier to compute.
         */
        [options.channelCount] : createChannelCount(options.numberOfOutputs),
        // Bug #66: The default value of processorOptions should be null, but Chrome Canary doesn't like it.
        processorOptions: options.processorOptions === null ? {} : options.processorOptions
      });
    };

    var createAudioWorkletNodeConstructor = function createAudioWorkletNodeConstructor(createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(AudioWorkletNode, _noneAudioDestination);

          function AudioWorkletNode(context, name) {
            var _this;

            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTIONS$3;

            _classCallCheck(this, AudioWorkletNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = sanitizedOptions(Object.assign({}, DEFAULT_OPTIONS$3, options));
            var nodeNameToProcessorDefinitionMap = NODE_NAME_TO_PROCESSOR_DEFINITION_MAPS.get(nativeContext);
            var processorDefinition = nodeNameToProcessorDefinitionMap === undefined ? undefined : nodeNameToProcessorDefinitionMap.get(name);
            var nativeAudioWorkletNode = createNativeAudioWorkletNode(nativeContext, nativeAudioWorkletNodeConstructor, name, processorDefinition, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var audioWorkletNodeRenderer = isOffline ? createAudioWorkletNodeRenderer(name, mergedOptions, processorDefinition) : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(AudioWorkletNode).call(this, context, nativeAudioWorkletNode, audioWorkletNodeRenderer));
            var parameters = [];
            nativeAudioWorkletNode.parameters.forEach(function (nativeAudioParam, nm) {
              var audioParam = createAudioParam(context, isOffline, nativeAudioParam);
              parameters.push([nm, audioParam]);
            });
            _this._nativeAudioWorkletNode = nativeAudioWorkletNode; // Bug #86 & #87: Every browser but Firefox needs to get an unused output which should not be exposed.

            _this._numberOfOutputs = options.numberOfOutputs === 0 ? 0 : _this._nativeAudioWorkletNode.numberOfOutputs;
            _this._parameters = new ReadOnlyMap(parameters);
            /*
             * Bug #86 & #87: Every browser but Firefox needs an output to be connected.
             *
             * Bug #50: Only Safari does yet allow to create AudioNodes on a closed AudioContext. Therefore this is currently faked by
             * using another AudioContext. And that is the reason why this will fail in case of a closed AudioContext.
             */

            if (options.numberOfOutputs === 0 && _this.context.state !== 'closed') {
              _this.connect(context.destination);
            }

            return _this;
          }

          _createClass(AudioWorkletNode, [{
            key: "numberOfOutputs",
            get: function get() {
              return this._numberOfOutputs;
            }
          }, {
            key: "onprocessorerror",
            get: function get() {
              return this._nativeAudioWorkletNode.onprocessorerror;
            },
            set: function set(value) {
              this._nativeAudioWorkletNode.onprocessorerror = value;
            }
          }, {
            key: "parameters",
            get: function get() {
              if (this._parameters === null) {
                return this._nativeAudioWorkletNode.parameters;
              }

              return this._parameters;
            }
          }, {
            key: "port",
            get: function get() {
              return this._nativeAudioWorkletNode.port;
            }
          }]);

          return AudioWorkletNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var renderInputsOfAudioParam = function renderInputsOfAudioParam(context, audioParam, nativeOfflineAudioContext, nativeAudioParam) {
      var audioParamConnections = getAudioParamConnections(context, audioParam);
      return Promise.all(Array.from(audioParamConnections.inputs).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            source = _ref2[0],
            output = _ref2[1];

        var audioNodeRenderer = getAudioNodeRenderer(source);
        return audioNodeRenderer.render(source, nativeOfflineAudioContext).then(function (node) {
          return node.connect(nativeAudioParam, output);
        });
      }));
    };

    var connectAudioParam = function connectAudioParam(context, nativeOfflineAudioContext, audioParam) {
      var nativeAudioParam = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : getNativeAudioParam(audioParam);
      return renderInputsOfAudioParam(context, audioParam, nativeOfflineAudioContext, nativeAudioParam);
    };

    var createNestedArrays = function createNestedArrays(x, y) {
      var arrays = [];

      for (var i = 0; i < x; i += 1) {
        var array = [];
        var length = typeof y === 'number' ? y : y[i];

        for (var j = 0; j < length; j += 1) {
          array.push(new Float32Array(128));
        }

        arrays.push(array);
      }

      return arrays;
    };

    var getAudioWorkletProcessor = function getAudioWorkletProcessor(nativeOfflineAudioContext, proxy) {
      var nodeToProcessorMap = NODE_TO_PROCESSOR_MAPS.get(nativeOfflineAudioContext);

      if (nodeToProcessorMap === undefined) {
        throw new Error('Missing the processor map for the given OfflineAudioContext.');
      }

      var nativeAudioWorkletNode = getNativeAudioNode(proxy);
      var audioWorkletProcessorPromise = nodeToProcessorMap.get(nativeAudioWorkletNode);

      if (audioWorkletProcessorPromise === undefined) {
        throw new Error('Missing the promise for the given AudioWorkletNode.');
      }

      return audioWorkletProcessorPromise;
    };

    function getAudioParamRenderer(anyContext, audioParam) {
      var audioParamConnections = getAudioParamConnections(anyContext, audioParam);

      if (audioParamConnections.renderer === null) {
        throw new Error('Missing the renderer of the given AudioParam in the audio graph.');
      }

      return audioParamConnections.renderer;
    }

    var renderAutomation = function renderAutomation(context, nativeOfflineAudioContext, audioParam, nativeAudioParam) {
      var audioParamRenderer = getAudioParamRenderer(context, audioParam);
      audioParamRenderer.replay(nativeAudioParam);
      return renderInputsOfAudioParam(context, audioParam, nativeOfflineAudioContext, nativeAudioParam);
    };

    var processBuffer =
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(proxy, renderedBuffer, nativeOfflineAudioContext, options, processorDefinition) {
        var length, numberOfInputChannels, numberOfOutputChannels, processedBuffer, audioNodeConnections, audioWorkletProcessor, inputs, outputs, parameters, _loop, i, _ret;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                length = renderedBuffer.length;
                numberOfInputChannels = options.channelCount * options.numberOfInputs;
                numberOfOutputChannels = options.outputChannelCount.reduce(function (sum, value) {
                  return sum + value;
                }, 0);
                processedBuffer = numberOfOutputChannels === 0 ? null : nativeOfflineAudioContext.createBuffer(numberOfOutputChannels, length, renderedBuffer.sampleRate);

                if (!(processorDefinition === undefined)) {
                  _context.next = 6;
                  break;
                }

                throw new Error();

              case 6:
                audioNodeConnections = getAudioNodeConnections(proxy);
                _context.next = 9;
                return getAudioWorkletProcessor(nativeOfflineAudioContext, proxy);

              case 9:
                audioWorkletProcessor = _context.sent;
                inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
                outputs = createNestedArrays(options.numberOfOutputs, options.outputChannelCount);
                parameters = Array.from(proxy.parameters.keys()).reduce(function (prmtrs, name, index) {
                  return Object.assign({}, prmtrs, _defineProperty({}, name, renderedBuffer.getChannelData(numberOfInputChannels + index)));
                }, {});

                _loop = function _loop(i) {
                  for (var j = 0; j < options.numberOfInputs; j += 1) {
                    for (var k = 0; k < options.channelCount; k += 1) {
                      // Bug #5: Safari does not support copyFromChannel().
                      var slicedRenderedBuffer = renderedBuffer.getChannelData(k).slice(i, i + 128);
                      inputs[j][k].set(slicedRenderedBuffer);
                    }
                  }

                  if (processorDefinition.parameterDescriptors !== undefined) {
                    processorDefinition.parameterDescriptors.forEach(function (_ref2, index) {
                      var name = _ref2.name;
                      var slicedRenderedBuffer = renderedBuffer.getChannelData(numberOfInputChannels + index).slice(i, i + 128);
                      parameters[name].set(slicedRenderedBuffer);
                    });
                  }

                  try {
                    var potentiallyEmptyInputs = inputs.map(function (input, index) {
                      if (audioNodeConnections.inputs[index].size === 0) {
                        return [];
                      }

                      return input;
                    });
                    var activeSourceFlag = audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters);

                    if (processedBuffer !== null) {
                      for (var _j = 0, outputChannelSplitterNodeOutput = 0; _j < options.numberOfOutputs; _j += 1) {
                        for (var _k = 0; _k < options.outputChannelCount[_j]; _k += 1) {
                          // Bug #5: Safari does not support copyToChannel().
                          processedBuffer.getChannelData(outputChannelSplitterNodeOutput + _k).set(outputs[_j][_k], i);
                        }

                        outputChannelSplitterNodeOutput += options.outputChannelCount[_j];
                      }
                    }

                    if (!activeSourceFlag) {
                      return "break";
                    }
                  } catch (_a) {
                    if (proxy.onprocessorerror !== null) {
                      proxy.onprocessorerror.call(null, new ErrorEvent('processorerror'));
                    }

                    return "break";
                  }
                };

                i = 0;

              case 15:
                if (!(i < length)) {
                  _context.next = 22;
                  break;
                }

                _ret = _loop(i);

                if (!(_ret === "break")) {
                  _context.next = 19;
                  break;
                }

                return _context.abrupt("break", 22);

              case 19:
                i += 128;
                _context.next = 15;
                break;

              case 22:
                return _context.abrupt("return", processedBuffer);

              case 23:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function processBuffer(_x, _x2, _x3, _x4, _x5) {
        return _ref.apply(this, arguments);
      };
    }();

    var createAudioWorkletNodeRendererFactory = function createAudioWorkletNodeRendererFactory(connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, disconnectMultipleOutputs, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderNativeOfflineAudioContext) {
      return function (name, options, processorDefinition) {
        var nativeAudioNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee4(proxy, nativeOfflineAudioContext) {
              var numberOfInputChannels, numberOfParameters, partialOfflineAudioContext, gainNodes, inputChannelSplitterNodes, i, constantSourceNodes, inputChannelMergerNode, _i, j, _arr, _i2, _arr$_i, index, constantSourceNode, _arr2, _i5, _arr2$_i, nm, audioParam, _arr3, _i6, _arr3$_i;

              return _regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      if (!(nativeAudioNode !== null)) {
                        _context4.next = 2;
                        break;
                      }

                      return _context4.abrupt("return", nativeAudioNode);

                    case 2:
                      nativeAudioNode = getNativeAudioNode(proxy); // Bug #61: Only Chrome & Opera have an implementation of the AudioWorkletNode yet.

                      if (!(nativeAudioWorkletNodeConstructor === null)) {
                        _context4.next = 23;
                        break;
                      }

                      if (!(processorDefinition === undefined)) {
                        _context4.next = 6;
                        break;
                      }

                      throw new Error('Missing the processor definition.');

                    case 6:
                      if (!(nativeOfflineAudioContextConstructor === null)) {
                        _context4.next = 8;
                        break;
                      }

                      throw new Error('Missing the native (Offline)AudioContext constructor.');

                    case 8:
                      // Bug #47: The AudioDestinationNode in Edge and Safari gets not initialized correctly.
                      numberOfInputChannels = proxy.channelCount * proxy.numberOfInputs;
                      numberOfParameters = processorDefinition.parameterDescriptors === undefined ? 0 : processorDefinition.parameterDescriptors.length;
                      partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(numberOfInputChannels + numberOfParameters, // Ceil the length to the next full render quantum.
                      // Bug #17: Safari does not yet expose the length.
                      Math.ceil(proxy.context.length / 128) * 128, nativeOfflineAudioContext.sampleRate);
                      gainNodes = [];
                      inputChannelSplitterNodes = [];

                      for (i = 0; i < options.numberOfInputs; i += 1) {
                        gainNodes.push(createNativeGainNode(partialOfflineAudioContext, {
                          channelCount: options.channelCount,
                          channelCountMode: options.channelCountMode,
                          channelInterpretation: options.channelInterpretation,
                          gain: 1
                        }));
                        inputChannelSplitterNodes.push(createNativeChannelSplitterNode(partialOfflineAudioContext, {
                          channelCount: options.channelCount,
                          channelCountMode: 'explicit',
                          channelInterpretation: 'discrete',
                          numberOfOutputs: options.channelCount
                        }));
                      }

                      _context4.next = 16;
                      return Promise.all(Array.from(proxy.parameters.values()).map(
                      /*#__PURE__*/
                      function () {
                        var _ref3 = _asyncToGenerator(
                        /*#__PURE__*/
                        _regeneratorRuntime.mark(function _callee2(audioParam) {
                          var constantSourceNode;
                          return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                            while (1) {
                              switch (_context2.prev = _context2.next) {
                                case 0:
                                  constantSourceNode = createNativeConstantSourceNode(partialOfflineAudioContext, {
                                    channelCount: 1,
                                    channelCountMode: 'explicit',
                                    channelInterpretation: 'discrete',
                                    offset: audioParam.value
                                  });
                                  _context2.next = 3;
                                  return renderAutomation(proxy.context, partialOfflineAudioContext, audioParam, constantSourceNode.offset);

                                case 3:
                                  return _context2.abrupt("return", constantSourceNode);

                                case 4:
                                case "end":
                                  return _context2.stop();
                              }
                            }
                          }, _callee2, this);
                        }));

                        return function (_x8) {
                          return _ref3.apply(this, arguments);
                        };
                      }()));

                    case 16:
                      constantSourceNodes = _context4.sent;
                      inputChannelMergerNode = createNativeChannelMergerNode(partialOfflineAudioContext, {
                        numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
                      });

                      for (_i = 0; _i < options.numberOfInputs; _i += 1) {
                        gainNodes[_i].connect(inputChannelSplitterNodes[_i]);

                        for (j = 0; j < options.channelCount; j += 1) {
                          inputChannelSplitterNodes[_i].connect(inputChannelMergerNode, j, _i * options.channelCount + j);
                        }
                      }

                      _arr = Array.from(constantSourceNodes.entries());

                      for (_i2 = 0; _i2 < _arr.length; _i2++) {
                        _arr$_i = _slicedToArray(_arr[_i2], 2), index = _arr$_i[0], constantSourceNode = _arr$_i[1];
                        constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
                        constantSourceNode.start(0);
                      }

                      inputChannelMergerNode.connect(partialOfflineAudioContext.destination);
                      return _context4.abrupt("return", Promise.all(gainNodes.map(function (gainNode) {
                        return renderInputsOfAudioNode(proxy, partialOfflineAudioContext, gainNode);
                      })).then(function () {
                        return renderNativeOfflineAudioContext(partialOfflineAudioContext);
                      }).then(
                      /*#__PURE__*/
                      function () {
                        var _ref4 = _asyncToGenerator(
                        /*#__PURE__*/
                        _regeneratorRuntime.mark(function _callee3(renderedBuffer) {
                          var audioBufferSourceNode, numberOfOutputChannels, outputChannelSplitterNode, outputChannelMergerNodes, _i3, processedBuffer, _i4, outputChannelSplitterNodeOutput, outputChannelMergerNode, _j2, outputAudioNodes;

                          return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                            while (1) {
                              switch (_context3.prev = _context3.next) {
                                case 0:
                                  audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext);
                                  numberOfOutputChannels = options.outputChannelCount.reduce(function (sum, value) {
                                    return sum + value;
                                  }, 0);
                                  outputChannelSplitterNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, {
                                    channelCount: Math.max(1, numberOfOutputChannels),
                                    channelCountMode: 'explicit',
                                    channelInterpretation: 'discrete',
                                    numberOfOutputs: Math.max(1, numberOfOutputChannels)
                                  });
                                  outputChannelMergerNodes = [];

                                  for (_i3 = 0; _i3 < proxy.numberOfOutputs; _i3 += 1) {
                                    outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeOfflineAudioContext, {
                                      numberOfInputs: options.outputChannelCount[_i3]
                                    }));
                                  }

                                  _context3.next = 7;
                                  return processBuffer(proxy, renderedBuffer, nativeOfflineAudioContext, options, processorDefinition);

                                case 7:
                                  processedBuffer = _context3.sent;

                                  if (processedBuffer !== null) {
                                    audioBufferSourceNode.buffer = processedBuffer;
                                    audioBufferSourceNode.start(0);
                                  }

                                  audioBufferSourceNode.connect(outputChannelSplitterNode);

                                  for (_i4 = 0, outputChannelSplitterNodeOutput = 0; _i4 < proxy.numberOfOutputs; _i4 += 1) {
                                    outputChannelMergerNode = outputChannelMergerNodes[_i4];

                                    for (_j2 = 0; _j2 < options.outputChannelCount[_i4]; _j2 += 1) {
                                      outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + _j2, _j2);
                                    }

                                    outputChannelSplitterNodeOutput += options.outputChannelCount[_i4];
                                  } // Bug #87: Expose at least one output to make this node connectable.


                                  outputAudioNodes = options.numberOfOutputs === 0 ? [outputChannelSplitterNode] : outputChannelMergerNodes;

                                  audioBufferSourceNode.connect = function () {
                                    return connectMultipleOutputs(outputAudioNodes, arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
                                  };

                                  audioBufferSourceNode.disconnect = function () {
                                    return disconnectMultipleOutputs(outputAudioNodes, arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
                                  };

                                  nativeAudioNode = audioBufferSourceNode;
                                  return _context3.abrupt("return", nativeAudioNode);

                                case 16:
                                case "end":
                                  return _context3.stop();
                              }
                            }
                          }, _callee3, this);
                        }));

                        return function (_x9) {
                          return _ref4.apply(this, arguments);
                        };
                      }()));

                    case 23:
                      if (isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) {
                        _context4.next = 36;
                        break;
                      }

                      nativeAudioNode = new nativeAudioWorkletNodeConstructor(nativeOfflineAudioContext, name); // @todo Using Array.from() is a lazy fix that should not be necessary forever.

                      _arr2 = Array.from(proxy.parameters.entries());
                      _i5 = 0;

                    case 27:
                      if (!(_i5 < _arr2.length)) {
                        _context4.next = 34;
                        break;
                      }

                      _arr2$_i = _slicedToArray(_arr2[_i5], 2), nm = _arr2$_i[0], audioParam = _arr2$_i[1];
                      _context4.next = 31;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, audioParam, nativeAudioNode.parameters.get(nm));

                    case 31:
                      _i5++;
                      _context4.next = 27;
                      break;

                    case 34:
                      _context4.next = 45;
                      break;

                    case 36:
                      // @todo Using Array.from() is a lazy fix that should not be necessary forever.
                      _arr3 = Array.from(proxy.parameters.entries());
                      _i6 = 0;

                    case 38:
                      if (!(_i6 < _arr3.length)) {
                        _context4.next = 45;
                        break;
                      }

                      _arr3$_i = _slicedToArray(_arr3[_i6], 2), nm = _arr3$_i[0], audioParam = _arr3$_i[1];
                      _context4.next = 42;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, audioParam, nativeAudioNode.parameters.get(nm));

                    case 42:
                      _i6++;
                      _context4.next = 38;
                      break;

                    case 45:
                      _context4.next = 47;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);

                    case 47:
                      return _context4.abrupt("return", nativeAudioNode);

                    case 48:
                    case "end":
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));

            return function render(_x6, _x7) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createBaseAudioContextConstructor = function createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, _decodeAudioData, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_minimalBaseAudioCont) {
          _inherits(BaseAudioContext, _minimalBaseAudioCont);

          function BaseAudioContext(nativeContext, numberOfChannels) {
            var _this;

            _classCallCheck(this, BaseAudioContext);

            _this = _possibleConstructorReturn(this, _getPrototypeOf(BaseAudioContext).call(this, nativeContext, numberOfChannels));
            _this._audioWorklet = addAudioWorkletModule === undefined ? undefined : {
              addModule: function addModule(moduleURL, options) {
                return addAudioWorkletModule(_assertThisInitialized(_assertThisInitialized(_this)), moduleURL, options);
              }
            };
            _this._nativeContext = nativeContext;
            return _this;
          }

          _createClass(BaseAudioContext, [{
            key: "createAnalyser",
            value: function createAnalyser() {
              return new analyserNodeConstructor(this);
            }
          }, {
            key: "createBiquadFilter",
            value: function createBiquadFilter() {
              return new biquadFilterNodeConstructor(this);
            }
          }, {
            key: "createBuffer",
            value: function createBuffer(numberOfChannels, length, sampleRate) {
              return new audioBufferConstructor({
                length: length,
                numberOfChannels: numberOfChannels,
                sampleRate: sampleRate
              });
            }
          }, {
            key: "createBufferSource",
            value: function createBufferSource() {
              return new audioBufferSourceNodeConstructor(this);
            }
          }, {
            key: "createChannelMerger",
            value: function createChannelMerger() {
              var numberOfInputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
              return new channelMergerNodeConstructor(this, {
                numberOfInputs: numberOfInputs
              });
            }
          }, {
            key: "createChannelSplitter",
            value: function createChannelSplitter() {
              var numberOfOutputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
              return new channelSplitterNodeConstructor(this, {
                numberOfOutputs: numberOfOutputs
              });
            }
          }, {
            key: "createConstantSource",
            value: function createConstantSource() {
              return new constantSourceNodeConstructor(this);
            }
          }, {
            key: "createGain",
            value: function createGain() {
              return new gainNodeConstructor(this);
            }
          }, {
            key: "createIIRFilter",
            value: function createIIRFilter(feedforward, feedback) {
              return new iIRFilterNodeConstructor(this, {
                feedback: feedback,
                feedforward: feedforward
              });
            }
          }, {
            key: "createOscillator",
            value: function createOscillator() {
              return new oscillatorNodeConstructor(this);
            }
          }, {
            key: "createStereoPanner",
            value: function createStereoPanner() {
              return new stereoPannerNodeConstructor(this);
            }
          }, {
            key: "createWaveShaper",
            value: function createWaveShaper() {
              return new waveShaperNodeConstructor(this);
            }
          }, {
            key: "decodeAudioData",
            value: function decodeAudioData(audioData, successCallback, errorCallback) {
              return _decodeAudioData(this._nativeContext, audioData).then(function (audioBuffer) {
                if (typeof successCallback === 'function') {
                  successCallback(audioBuffer);
                }

                return audioBuffer;
              }).catch(function (err) {
                if (typeof errorCallback === 'function') {
                  errorCallback(err);
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "audioWorklet",
            get: function get() {
              return this._audioWorklet;
            }
          }]);

          return BaseAudioContext;
        }(minimalBaseAudioContextConstructor)
      );
    };

    var DEFAULT_OPTIONS$4 = {
      Q: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      detune: 0,
      frequency: 350,
      gain: 0,
      type: 'lowpass'
    };
    var createBiquadFilterNodeConstructor = function createBiquadFilterNodeConstructor(createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(BiquadFilterNode, _noneAudioDestination);

          function BiquadFilterNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$4;

            _classCallCheck(this, BiquadFilterNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$4, options);
            var nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var biquadFilterNodeRenderer = isOffline ? createBiquadFilterNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(BiquadFilterNode).call(this, context, nativeBiquadFilterNode, biquadFilterNodeRenderer)); // Bug #80: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._Q = createAudioParam(context, isOffline, nativeBiquadFilterNode.Q, 3.4028234663852886e38, -3.4028234663852886e38); // Bug #78: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._detune = createAudioParam(context, isOffline, nativeBiquadFilterNode.detune, 3.4028234663852886e38, -3.4028234663852886e38); // Bug #77: Chrome, Edge, Firefox, Opera & Safari do not export the correct values for maxValue and minValue.

            _this._frequency = createAudioParam(context, isOffline, nativeBiquadFilterNode.frequency, 3.4028234663852886e38, -3.4028234663852886e38); // Bug #79: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._gain = createAudioParam(context, isOffline, nativeBiquadFilterNode.gain, 3.4028234663852886e38, -3.4028234663852886e38);
            _this._nativeBiquadFilterNode = nativeBiquadFilterNode;
            return _this;
          }

          _createClass(BiquadFilterNode, [{
            key: "getFrequencyResponse",
            value: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
              this._nativeBiquadFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse); // Bug #68: Only Chrome & Opera do throw an error if the parameters differ in their length.


              if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
                throw createInvalidAccessError();
              }
            }
          }, {
            key: "Q",
            get: function get() {
              return this._Q;
            }
          }, {
            key: "detune",
            get: function get() {
              return this._detune;
            }
          }, {
            key: "frequency",
            get: function get() {
              return this._frequency;
            }
          }, {
            key: "gain",
            get: function get() {
              return this._gain;
            }
          }, {
            key: "type",
            get: function get() {
              return this._nativeBiquadFilterNode.type;
            },
            set: function set(value) {
              this._nativeBiquadFilterNode.type = value;
            }
          }]);

          return BiquadFilterNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createBiquadFilterNodeRendererFactory = function createBiquadFilterNodeRendererFactory(createNativeBiquadFilterNode) {
      return function () {
        var nativeBiquadFilterNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeBiquadFilterNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeBiquadFilterNode);

                    case 2:
                      nativeBiquadFilterNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeBiquadFilterNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */

                      if (isOwnedByContext(nativeBiquadFilterNode, nativeOfflineAudioContext)) {
                        _context.next = 16;
                        break;
                      }

                      options = {
                        Q: nativeBiquadFilterNode.Q.value,
                        channelCount: nativeBiquadFilterNode.channelCount,
                        channelCountMode: nativeBiquadFilterNode.channelCountMode,
                        channelInterpretation: nativeBiquadFilterNode.channelInterpretation,
                        detune: nativeBiquadFilterNode.detune.value,
                        frequency: nativeBiquadFilterNode.frequency.value,
                        gain: nativeBiquadFilterNode.gain.value,
                        type: nativeBiquadFilterNode.type
                      };
                      nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeOfflineAudioContext, options);
                      _context.next = 8;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q);

                    case 8:
                      _context.next = 10;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune);

                    case 10:
                      _context.next = 12;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency);

                    case 12:
                      _context.next = 14;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain);

                    case 14:
                      _context.next = 24;
                      break;

                    case 16:
                      _context.next = 18;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.Q);

                    case 18:
                      _context.next = 20;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.detune);

                    case 20:
                      _context.next = 22;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.frequency);

                    case 22:
                      _context.next = 24;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.gain);

                    case 24:
                      _context.next = 26;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeBiquadFilterNode);

                    case 26:
                      return _context.abrupt("return", nativeBiquadFilterNode);

                    case 27:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var DEFAULT_OPTIONS$5 = {
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      numberOfInputs: 6
    };
    var createChannelMergerNodeConstructor = function createChannelMergerNodeConstructor(createChannelMergerNodeRenderer, createNativeChannelMergerNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(ChannelMergerNode, _noneAudioDestination);

          function ChannelMergerNode(context) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$5;

            _classCallCheck(this, ChannelMergerNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$5, options);
            var nativeChannelMergerNode = createNativeChannelMergerNode(nativeContext, mergedOptions);
            var channelMergerNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createChannelMergerNodeRenderer() : null;
            return _possibleConstructorReturn(this, _getPrototypeOf(ChannelMergerNode).call(this, context, nativeChannelMergerNode, channelMergerNodeRenderer));
          }

          return ChannelMergerNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createChannelMergerNodeRendererFactory = function createChannelMergerNodeRendererFactory(createNativeChannelMergerNode) {
      return function () {
        var nativeAudioNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeAudioNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeAudioNode);

                    case 2:
                      nativeAudioNode = getNativeAudioNode(proxy); // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.

                      if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) {
                        options = {
                          channelCount: nativeAudioNode.channelCount,
                          channelCountMode: nativeAudioNode.channelCountMode,
                          channelInterpretation: nativeAudioNode.channelInterpretation,
                          numberOfInputs: nativeAudioNode.numberOfInputs
                        };
                        nativeAudioNode = createNativeChannelMergerNode(nativeOfflineAudioContext, options);
                      }

                      _context.next = 6;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);

                    case 6:
                      return _context.abrupt("return", nativeAudioNode);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var DEFAULT_OPTIONS$6 = {
      channelCount: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
      numberOfOutputs: 6
    };

    var sanitizedOptions$1 = function sanitizedOptions(options) {
      return Object.assign({}, options, {
        channelCount: options.numberOfOutputs
      });
    };

    var createChannelSplitterNodeConstructor = function createChannelSplitterNodeConstructor(createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(ChannelSplitterNode, _noneAudioDestination);

          function ChannelSplitterNode(context) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$6;

            _classCallCheck(this, ChannelSplitterNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = sanitizedOptions$1(Object.assign({}, DEFAULT_OPTIONS$6, options));
            var nativeChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, mergedOptions);
            var channelSplitterNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createChannelSplitterNodeRenderer() : null;
            return _possibleConstructorReturn(this, _getPrototypeOf(ChannelSplitterNode).call(this, context, nativeChannelSplitterNode, channelSplitterNodeRenderer));
          }

          return ChannelSplitterNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createChannelSplitterNodeRendererFactory = function createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode) {
      return function () {
        var nativeAudioNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeAudioNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeAudioNode);

                    case 2:
                      nativeAudioNode = getNativeAudioNode(proxy); // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.

                      if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) {
                        options = {
                          channelCount: nativeAudioNode.channelCount,
                          channelCountMode: nativeAudioNode.channelCountMode,
                          channelInterpretation: nativeAudioNode.channelInterpretation,
                          numberOfOutputs: nativeAudioNode.numberOfOutputs
                        };
                        nativeAudioNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, options);
                      }

                      _context.next = 6;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);

                    case 6:
                      return _context.abrupt("return", nativeAudioNode);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var isNativeAudioNode = function isNativeAudioNode(nativeAudioNodeOrAudioParam) {
      return nativeAudioNodeOrAudioParam.context !== undefined;
    };

    var createConnectMultipleOutputs = function createConnectMultipleOutputs(createIndexSizeError) {
      return function (outputAudioNodes, destinationAudioNodeOrAudioParam) {
        var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var input = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var outputAudioNode = outputAudioNodes[output];

        if (outputAudioNode === undefined) {
          throw createIndexSizeError();
        }

        if (isNativeAudioNode(destinationAudioNodeOrAudioParam)) {
          return outputAudioNode.connect(destinationAudioNodeOrAudioParam, 0, input);
        }

        return outputAudioNode.connect(destinationAudioNodeOrAudioParam, 0);
      };
    };

    var DEFAULT_OPTIONS$7 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      offset: 1
    };
    var createConstantSourceNodeConstructor = function createConstantSourceNodeConstructor(createAudioParam, createConstantSourceNodeRendererFactory, createNativeConstantSourceNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(ConstantSourceNode, _noneAudioDestination);

          function ConstantSourceNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$7;

            _classCallCheck(this, ConstantSourceNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$7, options);
            var nativeConstantSourceNode = createNativeConstantSourceNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var constantSourceNodeRenderer = isOffline ? createConstantSourceNodeRendererFactory() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(ConstantSourceNode).call(this, context, nativeConstantSourceNode, constantSourceNodeRenderer));
            _this._constantSourceNodeRenderer = constantSourceNodeRenderer;
            _this._nativeConstantSourceNode = nativeConstantSourceNode;
            /*
             * Bug #62 & #74: Edge & Safari do not support ConstantSourceNodes and do not export the correct values for maxValue and
             * minValue for GainNodes.
             * Bug #75: Firefox does not export the correct values for maxValue and minValue.
             */

            _this._offset = createAudioParam(context, isOffline, nativeConstantSourceNode.offset, 3.4028234663852886e38, -3.4028234663852886e38);
            return _this;
          }

          _createClass(ConstantSourceNode, [{
            key: "start",
            value: function start() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              this._nativeConstantSourceNode.start(when);

              if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.start = when;
              }
            }
          }, {
            key: "stop",
            value: function stop() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              this._nativeConstantSourceNode.stop(when);

              if (this._constantSourceNodeRenderer !== null) {
                this._constantSourceNodeRenderer.stop = when;
              }
            }
          }, {
            key: "offset",
            get: function get() {
              return this._offset;
            }
          }, {
            key: "onended",
            get: function get() {
              return this._nativeConstantSourceNode.onended;
            },
            set: function set(value) {
              this._nativeConstantSourceNode.onended = value;
            }
          }]);

          return ConstantSourceNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createConstantSourceNodeRendererFactory = function createConstantSourceNodeRendererFactory(createNativeConstantSourceNode) {
      return function () {
        var nativeConstantSourceNode = null;
        var start = null;
        var stop = null;
        return {
          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeConstantSourceNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeConstantSourceNode);

                    case 2:
                      nativeConstantSourceNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeConstantSourceNode was not constructed on the same OfflineAudioContext it needs to be
                       * created again.
                       */

                      if (isOwnedByContext(nativeConstantSourceNode, nativeOfflineAudioContext)) {
                        _context.next = 12;
                        break;
                      }

                      options = {
                        channelCount: nativeConstantSourceNode.channelCount,
                        channelCountMode: nativeConstantSourceNode.channelCountMode,
                        channelInterpretation: nativeConstantSourceNode.channelInterpretation,
                        offset: nativeConstantSourceNode.offset.value
                      };
                      nativeConstantSourceNode = createNativeConstantSourceNode(nativeOfflineAudioContext, options);

                      if (start !== null) {
                        nativeConstantSourceNode.start(start);
                      }

                      if (stop !== null) {
                        nativeConstantSourceNode.stop(stop);
                      }

                      _context.next = 10;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset);

                    case 10:
                      _context.next = 14;
                      break;

                    case 12:
                      _context.next = 14;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.offset);

                    case 14:
                      _context.next = 16;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConstantSourceNode);

                    case 16:
                      return _context.abrupt("return", nativeConstantSourceNode);

                    case 17:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createDataCloneError = function createDataCloneError() {
      try {
        return new DOMException('', 'DataCloneError');
      } catch (err) {
        err.code = 25;
        err.name = 'DataCloneError';
        return err;
      }
    };

    var createDecodeAudioData = function createDecodeAudioData(createDataCloneError, createEncodingError, nativeOfflineAudioContextConstructor, isNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsSubarraySupport, testPromiseSupport) {
      return function (nativeContext, audioData) {
        // Bug #43: Only Chrome and Opera do throw a DataCloneError.
        if (DETACHED_ARRAY_BUFFERS.has(audioData)) {
          var err = createDataCloneError();
          return Promise.reject(err);
        } // The audioData parameter maybe of a type which can't be added to a WeakSet.


        try {
          DETACHED_ARRAY_BUFFERS.add(audioData);
        } catch (_a) {} // Ignore errors.
        // Bug #21: Safari does not support promises yet.


        if (cacheTestResult(testPromiseSupport, function () {
          return testPromiseSupport(nativeContext);
        })) {
          // Bug #101: Edge does not decode something on a closed OfflineAudioContext.
          var nativeContextOrBackupNativeContext = nativeContext.state === 'closed' && nativeOfflineAudioContextConstructor !== null && isNativeOfflineAudioContext(nativeContext) ? new nativeOfflineAudioContextConstructor(1, 1, nativeContext.sampleRate) : nativeContext;
          var promise = nativeContextOrBackupNativeContext.decodeAudioData(audioData).catch(function (err) {
            // Bug #27: Edge is rejecting invalid arrayBuffers with a DOMException.
            if (err instanceof DOMException && err.name === 'NotSupportedError') {
              throw new TypeError();
            }

            throw err;
          });
          setTimeout(function () {
            try {
              asyncArrayBuffer.deallocate(audioData);
            } catch (
            /* Ignore errors. */
            _a) {
              /* Ignore errors. */
            }
          });
          return promise.then(function (audioBuffer) {
            // Bug #42: Firefox does not yet fully support copyFromChannel() and copyToChannel().
            if (!cacheTestResult(testAudioBufferCopyChannelMethodsSubarraySupport, function () {
              return testAudioBufferCopyChannelMethodsSubarraySupport(audioBuffer);
            })) {
              wrapAudioBufferCopyChannelMethodsSubarray(audioBuffer);
            }

            return audioBuffer;
          });
        } // Bug #21: Safari does not return a Promise yet.


        return new Promise(function (resolve, reject) {
          var complete = function complete() {
            try {
              asyncArrayBuffer.deallocate(audioData);
            } catch (
            /* Ignore errors. */
            _a) {
              /* Ignore errors. */
            }
          };

          var fail = function fail(err) {
            reject(err);
            complete();
          };

          var succeed = function succeed(dBffrWrppr) {
            resolve(dBffrWrppr);
            complete();
          }; // Bug #26: Safari throws a synchronous error.


          try {
            // Bug #1: Safari requires a successCallback.
            nativeContext.decodeAudioData(audioData, function (audioBuffer) {
              // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
              // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
              if (typeof audioBuffer.copyFromChannel !== 'function') {
                wrapAudioBufferCopyChannelMethods(audioBuffer);
                wrapAudioBufferGetChannelDataMethod(audioBuffer);
              }

              succeed(audioBuffer);
            }, function (err) {
              // Bug #4: Safari returns null instead of an error.
              if (err === null) {
                fail(createEncodingError());
              } else {
                fail(err);
              }
            });
          } catch (err) {
            fail(err);
          }
        });
      };
    };

    var getOutputAudioNodeAtIndex = function getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output) {
      var outputAudioNode = outputAudioNodes[output];

      if (outputAudioNode === undefined) {
        throw createIndexSizeError();
      }

      return outputAudioNode;
    };

    var createDisconnectMultipleOutputs = function createDisconnectMultipleOutputs(createIndexSizeError) {
      return function (outputAudioNodes) {
        var outputOrDestinationAudioNodeOrAudioParam = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var input = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        if (outputOrDestinationAudioNodeOrAudioParam === undefined) {
          return outputAudioNodes.forEach(function (outputAudioNode) {
            return outputAudioNode.disconnect();
          });
        }

        if (typeof outputOrDestinationAudioNodeOrAudioParam === 'number') {
          return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, outputOrDestinationAudioNodeOrAudioParam).disconnect();
        }

        if (isNativeAudioNode(outputOrDestinationAudioNodeOrAudioParam)) {
          if (output === undefined) {
            return outputAudioNodes.forEach(function (outputAudioNode) {
              return outputAudioNode.disconnect(outputOrDestinationAudioNodeOrAudioParam);
            });
          }

          if (input === undefined) {
            return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(outputOrDestinationAudioNodeOrAudioParam, 0);
          }

          return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(outputOrDestinationAudioNodeOrAudioParam, 0, input);
        }

        if (output === undefined) {
          return outputAudioNodes.forEach(function (outputAudioNode) {
            return outputAudioNode.disconnect(outputOrDestinationAudioNodeOrAudioParam);
          });
        }

        return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(outputOrDestinationAudioNodeOrAudioParam, 0);
      };
    };

    var createEncodingError = function createEncodingError() {
      try {
        return new DOMException('', 'EncodingError');
      } catch (err) {
        err.code = 0;
        err.name = 'EncodingError';
        return err;
      }
    };

    var createFetchSource = function createFetchSource(createAbortError) {
      return (
        /*#__PURE__*/
        function () {
          var _ref = _asyncToGenerator(
          /*#__PURE__*/
          _regeneratorRuntime.mark(function _callee(url) {
            var response;
            return _regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    _context.next = 3;
                    return fetch(url);

                  case 3:
                    response = _context.sent;

                    if (!response.ok) {
                      _context.next = 6;
                      break;
                    }

                    return _context.abrupt("return", response.text());

                  case 6:
                    _context.next = 10;
                    break;

                  case 8:
                    _context.prev = 8;
                    _context.t0 = _context["catch"](0);

                  case 10:
                    throw createAbortError();

                  case 11:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this, [[0, 8]]);
          }));

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        }()
      );
    };

    var DEFAULT_OPTIONS$8 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      gain: 1
    };
    var createGainNodeConstructor = function createGainNodeConstructor(createAudioParam, createGainNodeRenderer, createNativeGainNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(GainNode, _noneAudioDestination);

          function GainNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$8;

            _classCallCheck(this, GainNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$8, options);
            var nativeGainNode = createNativeGainNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var gainNodeRenderer = isOffline ? createGainNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(GainNode).call(this, context, nativeGainNode, gainNodeRenderer)); // Bug #74: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._gain = createAudioParam(context, isOffline, nativeGainNode.gain, 3.4028234663852886e38, -3.4028234663852886e38);
            return _this;
          }

          _createClass(GainNode, [{
            key: "gain",
            get: function get() {
              return this._gain;
            }
          }]);

          return GainNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createGainNodeRendererFactory = function createGainNodeRendererFactory(createNativeGainNode) {
      return function () {
        var nativeGainNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeGainNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeGainNode);

                    case 2:
                      nativeGainNode = getNativeAudioNode(proxy); // If the initially used nativeGainNode was not constructed on the same OfflineAudioContext it needs to be created again.

                      if (isOwnedByContext(nativeGainNode, nativeOfflineAudioContext)) {
                        _context.next = 10;
                        break;
                      }

                      options = {
                        channelCount: nativeGainNode.channelCount,
                        channelCountMode: nativeGainNode.channelCountMode,
                        channelInterpretation: nativeGainNode.channelInterpretation,
                        gain: nativeGainNode.gain.value
                      };
                      nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, options);
                      _context.next = 8;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain);

                    case 8:
                      _context.next = 12;
                      break;

                    case 10:
                      _context.next = 12;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.gain);

                    case 12:
                      _context.next = 14;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeGainNode);

                    case 14:
                      return _context.abrupt("return", nativeGainNode);

                    case 15:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createGetBackupNativeContext = function createGetBackupNativeContext(isNativeOfflineAudioContext, nativeAudioContextConstructor, nativeOfflineAudioContextConstructor) {
      return function (nativeContext) {
        /*
         * Bug #50: Only Safari does currently allow to create AudioNodes on a closed context yet which is why there needs to be no
         * backupNativeContext in that case.
         */
        if (nativeContext.state === 'closed' && !window.hasOwnProperty('webkitAudioContext')) {
          if (isNativeOfflineAudioContext(nativeContext)) {
            var backupNativeContext = BACKUP_NATIVE_CONTEXT_STORE.get(nativeContext);

            if (backupNativeContext !== undefined) {
              return backupNativeContext;
            }

            if (nativeOfflineAudioContextConstructor !== null) {
              // @todo Copy the attached AudioWorkletProcessors and other settings.
              var bckpNtveCntxt = new nativeOfflineAudioContextConstructor(1, 1, 44100);
              BACKUP_NATIVE_CONTEXT_STORE.set(nativeContext, bckpNtveCntxt);
              return bckpNtveCntxt;
            }
          } else {
            var _backupNativeContext = BACKUP_NATIVE_CONTEXT_STORE.get(nativeContext);

            if (_backupNativeContext !== undefined) {
              return _backupNativeContext;
            }

            if (nativeAudioContextConstructor !== null) {
              // @todo Copy the attached AudioWorkletProcessors and other settings.
              var _bckpNtveCntxt = new nativeAudioContextConstructor();

              BACKUP_NATIVE_CONTEXT_STORE.set(nativeContext, _bckpNtveCntxt);
              return _bckpNtveCntxt;
            }
          }
        }

        return null;
      };
    };

    var createInvalidAccessError = function createInvalidAccessError() {
      try {
        return new DOMException('', 'InvalidAccessError');
      } catch (err) {
        err.code = 15;
        err.name = 'InvalidAccessError';
        return err;
      }
    };

    var wrapIIRFilterNodeGetFrequencyResponseMethod = function wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode) {
      nativeIIRFilterNode.getFrequencyResponse = function (getFrequencyResponse) {
        return function (frequencyHz, magResponse, phaseResponse) {
          if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
            throw createInvalidAccessError();
          }

          return getFrequencyResponse.call(nativeIIRFilterNode, frequencyHz, magResponse, phaseResponse);
        };
      }(nativeIIRFilterNode.getFrequencyResponse);
    };

    var DEFAULT_OPTIONS$9 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers'
    };
    var createIIRFilterNodeConstructor = function createIIRFilterNodeConstructor(createNativeIIRFilterNode, createIIRFilterNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(IIRFilterNode, _noneAudioDestination);

          function IIRFilterNode(context, options) {
            var _this;

            _classCallCheck(this, IIRFilterNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$9, options);
            var nativeIIRFilterNode = createNativeIIRFilterNode(nativeContext, mergedOptions);
            var iirFilterNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createIIRFilterNodeRenderer(mergedOptions.feedback, mergedOptions.feedforward) : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(IIRFilterNode).call(this, context, nativeIIRFilterNode, iirFilterNodeRenderer)); // Bug #23 & #24: FirefoxDeveloper does not throw an InvalidAccessError.
            // @todo Write a test which allows other browsers to remain unpatched.

            wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode);
            _this._nativeIIRFilterNode = nativeIIRFilterNode;
            return _this;
          }

          _createClass(IIRFilterNode, [{
            key: "getFrequencyResponse",
            value: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
              return this._nativeIIRFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
            }
          }]);

          return IIRFilterNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    // This implementation as shamelessly inspired by source code of
    // tslint:disable-next-line:max-line-length
    // {@link https://chromium.googlesource.com/chromium/src.git/+/master/third_party/WebKit/Source/platform/audio/IIRFilter.cpp|Chromium's IIRFilter}.
    var filterBuffer = function filterBuffer(feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffer, yBuffer, bufferIndex, bufferLength, input, output) {
      var inputLength = input.length;
      var i = bufferIndex;

      for (var j = 0; j < inputLength; j += 1) {
        var y = feedforward[0] * input[j];

        for (var k = 1; k < minLength; k += 1) {
          var x = i - k & bufferLength - 1; // tslint:disable-line:no-bitwise

          y += feedforward[k] * xBuffer[x];
          y -= feedback[k] * yBuffer[x];
        }

        for (var _k = minLength; _k < feedforwardLength; _k += 1) {
          y += feedforward[_k] * xBuffer[i - _k & bufferLength - 1]; // tslint:disable-line:no-bitwise
        }

        for (var _k2 = minLength; _k2 < feedbackLength; _k2 += 1) {
          y -= feedback[_k2] * yBuffer[i - _k2 & bufferLength - 1]; // tslint:disable-line:no-bitwise
        }

        xBuffer[i] = input[j];
        yBuffer[i] = y;
        i = i + 1 & bufferLength - 1; // tslint:disable-line:no-bitwise

        output[j] = y;
      }

      return i;
    };

    var filterFullBuffer = function filterFullBuffer(renderedBuffer, nativeOfflineAudioContext, feedback, feedforward) {
      var feedbackLength = feedback.length;
      var feedforwardLength = feedforward.length;
      var minLength = Math.min(feedbackLength, feedforwardLength);

      if (feedback[0] !== 1) {
        for (var i = 0; i < feedbackLength; i += 1) {
          feedforward[i] /= feedback[0];
        }

        for (var _i = 1; _i < feedforwardLength; _i += 1) {
          feedback[_i] /= feedback[0];
        }
      }

      var bufferLength = 32;
      var xBuffer = new Float32Array(bufferLength);
      var yBuffer = new Float32Array(bufferLength);
      var filteredBuffer = nativeOfflineAudioContext.createBuffer(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);
      var numberOfChannels = renderedBuffer.numberOfChannels;

      for (var _i2 = 0; _i2 < numberOfChannels; _i2 += 1) {
        var input = renderedBuffer.getChannelData(_i2);
        var output = filteredBuffer.getChannelData(_i2); // @todo Add a test which checks support for TypedArray.prototype.fill().

        xBuffer.fill(0);
        yBuffer.fill(0);
        filterBuffer(feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffer, yBuffer, 0, bufferLength, input, output);
      }

      return filteredBuffer;
    };

    var createIIRFilterNodeRendererFactory = function createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, createNativeAudioNode, nativeOfflineAudioContextConstructor, renderNativeOfflineAudioContext) {
      return function (feedback, feedforward) {
        var nativeAudioNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var partialOfflineAudioContext, renderedBuffer, audioBufferSourceNode;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeAudioNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeAudioNode);

                    case 2:
                      if (!(nativeOfflineAudioContextConstructor === null)) {
                        _context.next = 4;
                        break;
                      }

                      throw new Error();

                    case 4:
                      nativeAudioNode = getNativeAudioNode(proxy); // Bug #9: Safari does not support IIRFilterNodes.

                      if (!(nativeOfflineAudioContext.createIIRFilter === undefined)) {
                        _context.next = 19;
                        break;
                      }

                      partialOfflineAudioContext = new nativeOfflineAudioContextConstructor( // Bug #47: The AudioDestinationNode in Edge and Safari gets not initialized correctly.
                      proxy.context.destination.channelCount, // Bug #17: Safari does not yet expose the length.
                      proxy.context.length, nativeOfflineAudioContext.sampleRate);
                      _context.next = 9;
                      return renderInputsOfAudioNode(proxy, partialOfflineAudioContext, partialOfflineAudioContext.destination);

                    case 9:
                      _context.next = 11;
                      return renderNativeOfflineAudioContext(partialOfflineAudioContext);

                    case 11:
                      renderedBuffer = _context.sent;
                      audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext);
                      audioBufferSourceNode.buffer = filterFullBuffer(renderedBuffer, nativeOfflineAudioContext, feedback, feedforward);
                      audioBufferSourceNode.start(0);
                      nativeAudioNode = audioBufferSourceNode;
                      return _context.abrupt("return", nativeAudioNode);

                    case 19:
                      /*
                       * If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */
                      if (!isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext)) {
                        nativeAudioNode = createNativeAudioNode(nativeOfflineAudioContext, function (ntvCntxt) {
                          return ntvCntxt.createIIRFilter(feedforward, feedback);
                        });
                      }

                      _context.next = 22;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode);

                    case 22:
                      return _context.abrupt("return", nativeAudioNode);

                    case 23:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createIsNativeOfflineAudioContext = function createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor) {
      return function (nativeContext) {
        if (nativeOfflineAudioContextConstructor === null) {
          throw new Error('The native OfflineAudioContext constructor is missing.');
        }

        return nativeContext instanceof nativeOfflineAudioContextConstructor;
      };
    };

    var createIsSecureContext = function createIsSecureContext(window) {
      return window !== null && window.isSecureContext;
    };

    var createIsSupportedPromise = function createIsSupportedPromise(browsernizr, testAsyncArrayBufferSupport, testAudioContextCloseMethodSupport, testAudioContextDecodeAudioDataMethodTypeErrorSupport, testAudioContextOptionsSupport, testChannelMergerNodeSupport, testChannelSplitterNodeChannelCountSupport, testIsSecureContextSupport) {
      if (browsernizr.promises && browsernizr.typedarrays && browsernizr.webaudio && cacheTestResult(testAudioContextCloseMethodSupport, function () {
        return testAudioContextCloseMethodSupport();
      }) && cacheTestResult(testAudioContextOptionsSupport, function () {
        return testAudioContextOptionsSupport();
      }) && cacheTestResult(testChannelSplitterNodeChannelCountSupport, function () {
        return testChannelSplitterNodeChannelCountSupport();
      }) && cacheTestResult(testIsSecureContextSupport, function () {
        return testIsSecureContextSupport();
      })) {
        return Promise.all([cacheTestResult(testAsyncArrayBufferSupport, function () {
          return testAsyncArrayBufferSupport();
        }), cacheTestResult(testAudioContextDecodeAudioDataMethodTypeErrorSupport, function () {
          return testAudioContextDecodeAudioDataMethodTypeErrorSupport();
        }), cacheTestResult(testChannelMergerNodeSupport, function () {
          return testChannelMergerNodeSupport();
        })]).then(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 3),
              asyncArrayBufferSupport = _ref2[0],
              audioContextDecodeAudioDataMethodTypeErrorSupport = _ref2[1],
              channelMergerNodeSupport = _ref2[2];

          return asyncArrayBufferSupport && audioContextDecodeAudioDataMethodTypeErrorSupport && channelMergerNodeSupport;
        });
      }

      return Promise.resolve(false);
    };

    var getNativeAudioContext = function getNativeAudioContext(audioContext) {
      var nativeContext = CONTEXT_STORE.get(audioContext);

      if (nativeContext === undefined) {
        throw createInvalidStateError();
      }

      return nativeContext;
    };

    var DEFAULT_OPTIONS$a = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers'
    };
    var createMediaElementAudioSourceNodeConstructor = function createMediaElementAudioSourceNodeConstructor(createNativeMediaElementAudioSourceNode, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(MediaElementAudioSourceNode, _noneAudioDestination);

          function MediaElementAudioSourceNode(context, options) {
            var _this;

            _classCallCheck(this, MediaElementAudioSourceNode);

            var nativeContext = getNativeAudioContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$a, options);
            var nativeMediaElementAudioSourceNode = createNativeMediaElementAudioSourceNode(nativeContext, mergedOptions);
            _this = _possibleConstructorReturn(this, _getPrototypeOf(MediaElementAudioSourceNode).call(this, context, nativeMediaElementAudioSourceNode, null)); // Bug #63: Edge & Firefox do not expose the mediaElement yet.

            _this._mediaElement = mergedOptions.mediaElement;
            _this._nativeMediaElementAudioSourceNode = nativeMediaElementAudioSourceNode;
            return _this;
          }

          _createClass(MediaElementAudioSourceNode, [{
            key: "mediaElement",
            get: function get() {
              return this._nativeMediaElementAudioSourceNode.mediaElement === undefined ? this._mediaElement : this._nativeMediaElementAudioSourceNode.mediaElement;
            }
          }]);

          return MediaElementAudioSourceNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var DEFAULT_OPTIONS$b = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers'
    };
    var createMediaStreamAudioSourceNodeConstructor = function createMediaStreamAudioSourceNodeConstructor(createNativeMediaStreamAudioSourceNode, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(MediaStreamAudioSourceNode, _noneAudioDestination);

          function MediaStreamAudioSourceNode(context, options) {
            var _this;

            _classCallCheck(this, MediaStreamAudioSourceNode);

            var nativeContext = getNativeAudioContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$b, options);
            var nativeMediaStreamAudioSourceNode = createNativeMediaStreamAudioSourceNode(nativeContext, mergedOptions);
            _this = _possibleConstructorReturn(this, _getPrototypeOf(MediaStreamAudioSourceNode).call(this, context, nativeMediaStreamAudioSourceNode, null)); // Bug #63: Edge & Firefox do not expose the mediaStream yet.

            _this._mediaStream = mergedOptions.mediaStream;
            _this._nativeMediaStreamAudioSourceNode = nativeMediaStreamAudioSourceNode;
            return _this;
          }

          _createClass(MediaStreamAudioSourceNode, [{
            key: "mediaStream",
            get: function get() {
              return this._nativeMediaStreamAudioSourceNode.mediaStream === undefined ? this._mediaStream : this._nativeMediaStreamAudioSourceNode.mediaStream;
            }
          }]);

          return MediaStreamAudioSourceNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createMinimalAudioContextConstructor = function createMinimalAudioContextConstructor(createInvalidStateError, minimalBaseAudioContextConstructor, nativeAudioContextConstructor) {
      return (
        /*#__PURE__*/
        function (_minimalBaseAudioCont) {
          _inherits(MinimalAudioContext, _minimalBaseAudioCont);

          function MinimalAudioContext() {
            var _this;

            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            _classCallCheck(this, MinimalAudioContext);

            if (nativeAudioContextConstructor === null) {
              throw new Error(); // @todo
            }

            var nativeAudioContext = new nativeAudioContextConstructor(options); // Bug #51 Only Chrome and Opera throw an error if the given latencyHint is invalid.

            if (!isValidLatencyHint(options.latencyHint)) {
              throw new TypeError("The provided value '".concat(options.latencyHint, "' is not a valid enum value of type AudioContextLatencyCategory."));
            }

            _this = _possibleConstructorReturn(this, _getPrototypeOf(MinimalAudioContext).call(this, nativeAudioContext, nativeAudioContext.destination.channelCount));
            _this._state = null;
            _this._nativeAudioContext = nativeAudioContext;
            /*
             * Bug #34: Chrome and Opera pretend to be running right away, but fire an onstatechange event when the state actually
             * changes to 'running'.
             */

            if (nativeAudioContext.state === 'running') {
              _this._state = 'suspended';

              var revokeState = function revokeState() {
                if (_this._state === 'suspended') {
                  _this._state = null;
                }

                if (nativeAudioContext.removeEventListener) {
                  nativeAudioContext.removeEventListener('statechange', revokeState);
                }
              };

              nativeAudioContext.addEventListener('statechange', revokeState);
            }

            return _this;
          }

          _createClass(MinimalAudioContext, [{
            key: "close",
            value: function close() {
              // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
              if (this.state === 'closed') {
                return this._nativeAudioContext.close().then(function () {
                  throw createInvalidStateError();
                });
              } // Bug #34: If the state was set to suspended before it should be revoked now.


              if (this._state === 'suspended') {
                this._state = null;
              }

              return this._nativeAudioContext.close();
              /*
               * Bug #50: Deleting the AudioGraph is currently not possible anymore.
               * ...then(() => deleteAudioGraph(this, this._nativeAudioContext));
               */
            }
          }, {
            key: "resume",
            value: function resume() {
              return this._nativeAudioContext.resume().catch(function (err) {
                // Bug #55: Chrome, Edge and Opera do throw an InvalidAccessError instead of an InvalidStateError.
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined || err.code === 15) {
                  throw createInvalidStateError();
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "suspend",
            value: function suspend() {
              return this._nativeAudioContext.suspend().catch(function (err) {
                // Bug #56: Safari invokes the catch handler but without an error.
                if (err === undefined) {
                  throw createInvalidStateError();
                }

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "state",
            get: function get() {
              return this._state !== null ? this._state : this._nativeAudioContext.state;
            }
          }]);

          return MinimalAudioContext;
        }(minimalBaseAudioContextConstructor)
      );
    };

    var createMinimalBaseAudioContextConstructor = function createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_EventTarget) {
          _inherits(MinimalBaseAudioContext, _EventTarget);

          function MinimalBaseAudioContext(nativeContext, numberOfChannels) {
            var _this;

            _classCallCheck(this, MinimalBaseAudioContext);

            _this = _possibleConstructorReturn(this, _getPrototypeOf(MinimalBaseAudioContext).call(this));
            CONTEXT_STORE.set(_assertThisInitialized(_assertThisInitialized(_this)), nativeContext); // Bug #93: Edge will set the sampleRate of an AudioContext to zero when it is closed.

            var sampleRate = nativeContext.sampleRate;
            Object.defineProperty(nativeContext, 'sampleRate', {
              get: function get() {
                return sampleRate;
              }
            });
            _this._nativeContext = nativeContext;
            _this._destination = new audioDestinationNodeConstructor(_assertThisInitialized(_assertThisInitialized(_this)), numberOfChannels);
            return _this;
          }

          _createClass(MinimalBaseAudioContext, [{
            key: "currentTime",
            get: function get() {
              return this._nativeContext.currentTime;
            }
          }, {
            key: "destination",
            get: function get() {
              return this._destination;
            }
          }, {
            key: "onstatechange",
            get: function get() {
              return this._nativeContext.onstatechange;
            },
            set: function set(value) {
              this._nativeContext.onstatechange = value;
            }
          }, {
            key: "sampleRate",
            get: function get() {
              return this._nativeContext.sampleRate;
            }
          }, {
            key: "state",
            get: function get() {
              return this._nativeContext.state;
            }
          }]);

          return MinimalBaseAudioContext;
        }(EventTarget)
      );
    };

    var testPromiseSupport = function testPromiseSupport(nativeContext) {
      // This 12 numbers represent the 48 bytes of an empty WAVE file with a single sample.
      var uint32Array = new Uint32Array([1179011410, 40, 1163280727, 544501094, 16, 131073, 44100, 176400, 1048580, 1635017060, 4, 0]);

      try {
        // Bug #1: Safari requires a successCallback.
        var promise = nativeContext.decodeAudioData(uint32Array.buffer, function () {// Ignore the success callback.
        });

        if (promise === undefined) {
          return false;
        }

        promise.catch(function () {// Ignore rejected errors.
        });
        return true;
      } catch (_a) {// Ignore errors.
      }

      return false;
    };

    var DEFAULT_OPTIONS$c = {
      numberOfChannels: 1
    };
    var createMinimalOfflineAudioContextConstructor = function createMinimalOfflineAudioContextConstructor(createInvalidStateError, minimalBaseAudioContextConstructor, nativeOfflineAudioContextConstructor, _startRendering) {
      return (
        /*#__PURE__*/
        function (_minimalBaseAudioCont) {
          _inherits(MinimalOfflineAudioContext, _minimalBaseAudioCont);

          function MinimalOfflineAudioContext(options) {
            var _this;

            _classCallCheck(this, MinimalOfflineAudioContext);

            if (nativeOfflineAudioContextConstructor === null) {
              throw new Error(); // @todo
            }

            var _Object$assign = Object.assign({}, DEFAULT_OPTIONS$c, options),
                length = _Object$assign.length,
                numberOfChannels = _Object$assign.numberOfChannels,
                sampleRate = _Object$assign.sampleRate;

            var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(numberOfChannels, length, sampleRate); // #21 Safari does not support promises and therefore would fire the statechange event before the promise can be resolved.

            if (!cacheTestResult(testPromiseSupport, function () {
              return testPromiseSupport(nativeOfflineAudioContext);
            })) {
              nativeOfflineAudioContext.addEventListener('statechange', function () {
                var i = 0;

                var delayStateChangeEvent = function delayStateChangeEvent(event) {
                  if (_this._state === 'running') {
                    if (i > 0) {
                      nativeOfflineAudioContext.removeEventListener('statechange', delayStateChangeEvent);
                      event.stopImmediatePropagation();

                      _this._waitForThePromiseToSettle(event);
                    } else {
                      i += 1;
                    }
                  }
                };

                return delayStateChangeEvent;
              }());
            }

            _this = _possibleConstructorReturn(this, _getPrototypeOf(MinimalOfflineAudioContext).call(this, nativeOfflineAudioContext, numberOfChannels));
            _this._length = length;
            _this._nativeOfflineAudioContext = nativeOfflineAudioContext;
            _this._state = null;
            return _this;
          }

          _createClass(MinimalOfflineAudioContext, [{
            key: "startRendering",
            value: function startRendering() {
              var _this2 = this;

              /*
               * Bug #9 & #59: It is theoretically possible that startRendering() will first render a partialOfflineAudioContext. Therefore
               * the state of the nativeOfflineAudioContext might no transition to running immediately.
               */
              if (this._state === 'running') {
                return Promise.reject(createInvalidStateError());
              }

              this._state = 'running';
              return _startRendering(this.destination, this._nativeOfflineAudioContext).then(function (audioBuffer) {
                _this2._state = null;
                /*
                 * Bug #50: Deleting the AudioGraph is currently not possible anymore.
                 * deleteAudioGraph(this, this._nativeOfflineAudioContext);
                 */

                return audioBuffer;
              }) // @todo This could be written more elegantly when Promise.finally() becomes avalaible.
              .catch(function (err) {
                _this2._state = null;
                /*
                 * Bug #50: Deleting the AudioGraph is currently not possible anymore.
                 * deleteAudioGraph(this, this._nativeOfflineAudioContext);
                 */

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "_waitForThePromiseToSettle",
            value: function _waitForThePromiseToSettle(event) {
              var _this3 = this;

              if (this._state === null) {
                this._nativeOfflineAudioContext.dispatchEvent(event);
              } else {
                setTimeout(function () {
                  return _this3._waitForThePromiseToSettle(event);
                });
              }
            }
          }, {
            key: "length",
            get: function get() {
              // Bug #17: Safari does not yet expose the length.
              if (this._nativeOfflineAudioContext.length === undefined) {
                return this._length;
              }

              return this._nativeOfflineAudioContext.length;
            }
          }, {
            key: "state",
            get: function get() {
              return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
            }
          }]);

          return MinimalOfflineAudioContext;
        }(minimalBaseAudioContextConstructor)
      );
    };

    // @todo Use the same strategy to assign all node specific options as well.
    var assignNativeAudioNodeOption = function assignNativeAudioNodeOption(nativeAudioNode, options, option) {
      var value = options[option];

      if (value !== undefined && value !== nativeAudioNode[option]) {
        nativeAudioNode[option] = value;
      }
    };

    var assignNativeAudioNodeOptions = function assignNativeAudioNodeOptions(nativeAudioNode) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCount');
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCountMode');
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelInterpretation');
    };

    var testAnalyserNodeGetFloatTimeDomainDataMethodSupport = function testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode) {
      return typeof nativeAnalyserNode.getFloatTimeDomainData === 'function';
    };

    var wrapAnalyserNodeGetFloatTimeDomainDataMethod = function wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode) {
      nativeAnalyserNode.getFloatTimeDomainData = function (array) {
        var byteTimeDomainData = new Uint8Array(array.length);
        nativeAnalyserNode.getByteTimeDomainData(byteTimeDomainData);
        var length = Math.max(byteTimeDomainData.length, nativeAnalyserNode.fftSize);

        for (var i = 0; i < length; i += 1) {
          array[i] = (byteTimeDomainData[i] - 128) * 0.0078125;
        }

        return array;
      };
    };

    var createNativeAnalyserNodeFactory = function createNativeAnalyserNodeFactory(createNativeAudioNode) {
      return function (nativeContext, options) {
        var nativeAnalyserNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createAnalyser();
        });
        assignNativeAudioNodeOptions(nativeAnalyserNode, options);

        if (options.fftSize !== nativeAnalyserNode.fftSize) {
          nativeAnalyserNode.fftSize = options.fftSize;
        }

        if (options.maxDecibels !== nativeAnalyserNode.maxDecibels) {
          nativeAnalyserNode.maxDecibels = options.maxDecibels;
        }

        if (options.minDecibels !== nativeAnalyserNode.minDecibels) {
          nativeAnalyserNode.minDecibels = options.minDecibels;
        }

        if (options.smoothingTimeConstant !== nativeAnalyserNode.smoothingTimeConstant) {
          nativeAnalyserNode.smoothingTimeConstant = options.smoothingTimeConstant;
        } // Bug #37: Only Edge and Safari create an AnalyserNode with the default properties.


        if (nativeAnalyserNode.channelCount === 1) {
          nativeAnalyserNode.channelCount = 2;
        } // Bug #36: Safari does not support getFloatTimeDomainData() yet.


        if (!cacheTestResult(testAnalyserNodeGetFloatTimeDomainDataMethodSupport, function () {
          return testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode);
        })) {
          wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode);
        }

        return nativeAnalyserNode;
      };
    };

    var createNativeAudioBufferConstructor = function createNativeAudioBufferConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('AudioBuffer')) {
        // @todo TypeScript doesn't know yet about the AudioBuffer constructor.
        return window.AudioBuffer;
      }

      return null;
    };

    var wrapAudioBufferSourceNodeStartMethodConsecutiveCalls = function wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode) {
      nativeAudioBufferSourceNode.start = function (start) {
        var isScheduled = false;
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 ? arguments[2] : undefined;

          if (isScheduled) {
            throw createInvalidStateError();
          }

          start.call(nativeAudioBufferSourceNode, when, offset, duration);
          isScheduled = true;
        };
      }(nativeAudioBufferSourceNode.start);
    };

    var wrapAudioBufferSourceNodeStartMethodDurationParameter = function wrapAudioBufferSourceNodeStartMethodDurationParameter(nativeAudioScheduledSourceNode, nativeContext) {
      var endTime = Number.POSITIVE_INFINITY;
      var stopTime = Number.POSITIVE_INFINITY;

      nativeAudioScheduledSourceNode.start = function (start, stop) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Number.POSITIVE_INFINITY;
          start.call(nativeAudioScheduledSourceNode, when, offset);

          if (duration >= 0 && duration < Number.POSITIVE_INFINITY) {
            var actualStartTime = Math.max(when, nativeContext.currentTime); // @todo The playbackRate could of course also have been automated and is not always fixed.

            var durationInBufferTime = duration / nativeAudioScheduledSourceNode.playbackRate.value;
            endTime = actualStartTime + durationInBufferTime;
            stop.call(nativeAudioScheduledSourceNode, Math.min(endTime, stopTime));
          }
        };
      }(nativeAudioScheduledSourceNode.start, nativeAudioScheduledSourceNode.stop);

      nativeAudioScheduledSourceNode.stop = function (stop) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          stopTime = Math.max(when, nativeContext.currentTime);
          stop.call(nativeAudioScheduledSourceNode, Math.min(endTime, stopTime));
        };
      }(nativeAudioScheduledSourceNode.stop);
    };

    var wrapAudioScheduledSourceNodeStartMethodNegativeParameters = function wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioScheduledSourceNode) {
      nativeAudioScheduledSourceNode.start = function (start) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 ? arguments[2] : undefined;

          if (typeof duration === 'number' && duration < 0 || offset < 0 || when < 0) {
            throw new RangeError("The parameters can't be negative.");
          }

          start.call(nativeAudioScheduledSourceNode, when, offset, duration);
        };
      }(nativeAudioScheduledSourceNode.start);
    };

    var wrapAudioScheduledSourceNodeStopMethodNegativeParameters = function wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioScheduledSourceNode) {
      nativeAudioScheduledSourceNode.stop = function (stop) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

          if (when < 0) {
            throw new RangeError("The parameter can't be negative.");
          }

          stop.call(nativeAudioScheduledSourceNode, when);
        };
      }(nativeAudioScheduledSourceNode.stop);
    };

    var createNativeAudioBufferSourceNodeFactory = function createNativeAudioBufferSourceNodeFactory(createNativeAudioNode, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodDurationParameterSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) {
      return function (nativeContext) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var nativeAudioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });
        assignNativeAudioNodeOptions(nativeAudioBufferSourceNode, options); // Bug #71: Edge does not allow to set the buffer to null.

        if (options.buffer !== undefined && options.buffer !== null) {
          nativeAudioBufferSourceNode.buffer = options.buffer;
        } // @todo if (options.detune !== undefined) {
        // @todo    nativeAudioBufferSourceNode.detune.value = options.detune;
        // @todo }


        if (options.loop !== undefined) {
          nativeAudioBufferSourceNode.loop = options.loop;
        }

        if (options.loopEnd !== undefined) {
          nativeAudioBufferSourceNode.loopEnd = options.loopEnd;
        }

        if (options.loopStart !== undefined) {
          nativeAudioBufferSourceNode.loopStart = options.loopStart;
        }

        if (options.playbackRate !== undefined) {
          nativeAudioBufferSourceNode.playbackRate.value = options.playbackRate;
        } // Bug #69: Safari does allow calls to start() of an already scheduled AudioBufferSourceNode.


        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, function () {
          return testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode);
        } // Bug #92: Edge does not respect the duration parameter yet.


        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodDurationParameterSupport, function () {
          return testAudioBufferSourceNodeStartMethodDurationParameterSupport();
        })) {
          wrapAudioBufferSourceNodeStartMethodDurationParameter(nativeAudioBufferSourceNode, nativeContext);
        } // Bug #44: Only Chrome & Opera throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioBufferSourceNode);
        } // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, function () {
          return testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeAudioBufferSourceNode, nativeContext);
        } // Bug #44: No browser does throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioBufferSourceNode);
        }

        return nativeAudioBufferSourceNode;
      };
    };

    var createNativeAudioContextConstructor = function createNativeAudioContextConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('AudioContext')) {
        return window.AudioContext;
      }

      return window.hasOwnProperty('webkitAudioContext') ? window.webkitAudioContext : null;
    };

    var createNativeAudioDestinationNode = function createNativeAudioDestinationNode(nativeContext, channelCount, isNodeOfNativeOfflineAudioContext) {
      var nativeAudioDestinationNode = nativeContext.destination; // @todo Which bug is that covering?

      if (nativeAudioDestinationNode.channelCount !== channelCount) {
        nativeAudioDestinationNode.channelCount = channelCount;
      } // Bug #83: Edge & Safari do not have the correct channelCountMode.


      if (isNodeOfNativeOfflineAudioContext && nativeAudioDestinationNode.channelCountMode !== 'explicit') {
        nativeAudioDestinationNode.channelCountMode = 'explicit';
      } // Bug #47: The AudioDestinationNode in Edge and Safari do not initialize the maxChannelCount property correctly.


      if (nativeAudioDestinationNode.maxChannelCount === 0) {
        Object.defineProperty(nativeAudioDestinationNode, 'maxChannelCount', {
          get: function get() {
            return nativeAudioDestinationNode.channelCount;
          }
        });
      }

      return nativeAudioDestinationNode;
    };

    var createNativeAudioNodeFactory = function createNativeAudioNodeFactory(getBackupNativeContext) {
      return function (nativeContext, factoryFunction) {
        // Bug #50: Only Safari does currently allow to create AudioNodes on a closed context yet.
        var backupNativeContext = getBackupNativeContext(nativeContext);

        if (backupNativeContext !== null) {
          return factoryFunction(backupNativeContext);
        }

        return factoryFunction(nativeContext);
      };
    };

    var createNativeAudioWorkletNodeConstructor = function createNativeAudioWorkletNodeConstructor(window) {
      if (window === null) {
        return null;
      }

      return window.hasOwnProperty('AudioWorkletNode') ? window.AudioWorkletNode : null;
    };

    var testClonabilityOfAudioWorkletNodeOptions = function testClonabilityOfAudioWorkletNodeOptions(audioWorkletNodeOptions) {
      var _ref = new MessageChannel(),
          port1 = _ref.port1;

      try {
        // This will throw an error if the audioWorkletNodeOptions are not clonable.
        port1.postMessage(audioWorkletNodeOptions);
      } finally {
        port1.close();
      }
    };

    var createNativeAudioWorkletNodeFactory = function createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioNode, createNativeAudioWorkletNodeFaker, createNotSupportedError) {
      return function (nativeContext, nativeAudioWorkletNodeConstructor, name, processorDefinition, options) {
        if (nativeAudioWorkletNodeConstructor !== null) {
          try {
            // Bug #86: Chrome Canary does not invoke the process() function if the corresponding AudioWorkletNode has no output.
            var nativeAudioWorkletNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
              return options.numberOfInputs !== 0 && options.numberOfOutputs === 0 ? new nativeAudioWorkletNodeConstructor(ntvCntxt, name, Object.assign({}, options, {
                numberOfOutputs: 1,
                outputChannelCount: [1],
                parameterData: Object.assign({}, options.parameterData, {
                  hasNoOutput: 1
                })
              })) : new nativeAudioWorkletNodeConstructor(ntvCntxt, name, options);
            });
            /*
             * Bug #61: Overwriting the property accessors is necessary as long as some browsers have no native implementation to
             * achieve a consistent behavior.
             */

            Object.defineProperties(nativeAudioWorkletNode, {
              channelCount: {
                get: function get() {
                  return options.channelCount;
                },
                set: function set() {
                  throw createInvalidStateError();
                }
              },
              channelCountMode: {
                get: function get() {
                  return 'explicit';
                },
                set: function set() {
                  throw createInvalidStateError();
                }
              }
            });
            return nativeAudioWorkletNode;
          } catch (err) {
            // Bug #60: Chrome Canary throws an InvalidStateError instead of a NotSupportedError.
            if (err.code === 11 && nativeContext.state !== 'closed') {
              throw createNotSupportedError();
            }

            throw err; // tslint:disable-line:rxjs-throw-error
          }
        } // Bug #61: Only Chrome & Opera have an implementation of the AudioWorkletNode yet.


        if (processorDefinition === undefined) {
          throw createNotSupportedError();
        }

        testClonabilityOfAudioWorkletNodeOptions(options);
        return createNativeAudioWorkletNodeFaker(nativeContext, processorDefinition, options);
      };
    };

    var cloneAudioWorkletNodeOptions = function cloneAudioWorkletNodeOptions(audioWorkletNodeOptions) {
      return new Promise(function (resolve, reject) {
        var _ref = new MessageChannel(),
            port1 = _ref.port1,
            port2 = _ref.port2;

        port1.onmessage = function (_ref2) {
          var data = _ref2.data;
          port1.close();
          port2.close();
          resolve(data);
        };

        port1.onmessageerror = function (_ref3) {
          var data = _ref3.data;
          port1.close();
          port2.close();
          reject(data);
        }; // This will throw an error if the audioWorkletNodeOptions are not clonable.


        port2.postMessage(audioWorkletNodeOptions);
      });
    };

    var createAudioWorkletProcessorPromise =
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee(processorDefinition, audioWorkletNodeOptions) {
        var clonedAudioWorkletNodeOptions;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return cloneAudioWorkletNodeOptions(audioWorkletNodeOptions);

              case 2:
                clonedAudioWorkletNodeOptions = _context.sent;
                return _context.abrupt("return", new processorDefinition(clonedAudioWorkletNodeOptions));

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function createAudioWorkletProcessorPromise(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();

    var createAudioWorkletProcessor = function createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNode, processorDefinition, audioWorkletNodeOptions) {
      var nodeToProcessorMap = NODE_TO_PROCESSOR_MAPS.get(nativeContext);

      if (nodeToProcessorMap === undefined) {
        nodeToProcessorMap = new WeakMap();
        NODE_TO_PROCESSOR_MAPS.set(nativeContext, nodeToProcessorMap);
      }

      var audioWorkletProcessorPromise = createAudioWorkletProcessorPromise(processorDefinition, audioWorkletNodeOptions);
      nodeToProcessorMap.set(nativeAudioWorkletNode, audioWorkletProcessorPromise);
      return audioWorkletProcessorPromise;
    };

    var createNativeAudioWorkletNodeFakerFactory = function createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs) {
      return function (nativeContext, processorDefinition, options) {
        if (options.numberOfInputs === 0 && options.numberOfOutputs === 0) {
          throw createNotSupportedError();
        }

        if (options.outputChannelCount !== undefined) {
          if (options.outputChannelCount.length !== options.numberOfOutputs) {
            throw createIndexSizeError();
          } // @todo Check if any of the channelCount values is greater than the implementation's maximum number of channels.


          if (options.outputChannelCount.some(function (channelCount) {
            return channelCount < 1;
          })) {
            throw createNotSupportedError();
          }
        } // Bug #61: This is not part of the standard but required for the faker to work.


        if (options.channelCountMode !== 'explicit') {
          throw createNotSupportedError();
        }

        var numberOfInputChannels = options.channelCount * options.numberOfInputs;
        var numberOfOutputChannels = options.outputChannelCount.reduce(function (sum, value) {
          return sum + value;
        }, 0);
        var numberOfParameters = processorDefinition.parameterDescriptors === undefined ? 0 : processorDefinition.parameterDescriptors.length; // Bug #61: This is not part of the standard but required for the faker to work.

        if (numberOfInputChannels + numberOfParameters > 6 || numberOfOutputChannels > 6) {
          throw createNotSupportedError();
        }

        var messageChannel = new MessageChannel();
        var gainNodes = [];
        var inputChannelSplitterNodes = [];

        for (var i = 0; i < options.numberOfInputs; i += 1) {
          gainNodes.push(createNativeGainNode(nativeContext, {
            channelCount: options.channelCount,
            channelCountMode: options.channelCountMode,
            channelInterpretation: options.channelInterpretation,
            gain: 1
          }));
          inputChannelSplitterNodes.push(createNativeChannelSplitterNode(nativeContext, {
            channelCount: options.channelCount,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            numberOfOutputs: options.channelCount
          }));
        }

        var constantSourceNodes = [];

        if (processorDefinition.parameterDescriptors !== undefined) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            var _loop = function _loop() {
              var _step$value = _step.value,
                  defaultValue = _step$value.defaultValue,
                  maxValue = _step$value.maxValue,
                  minValue = _step$value.minValue;
              var constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                offset: defaultValue === undefined ? 0 : defaultValue
              });
              Object.defineProperties(constantSourceNode.offset, {
                defaultValue: {
                  get: function get() {
                    return defaultValue === undefined ? 0 : defaultValue;
                  }
                },
                maxValue: {
                  get: function get() {
                    return maxValue === undefined ? 3.4028234663852886e38 : maxValue;
                  }
                },
                minValue: {
                  get: function get() {
                    return minValue === undefined ? -3.4028234663852886e38 : minValue;
                  }
                }
              });
              constantSourceNodes.push(constantSourceNode);
            };

            for (var _iterator = processorDefinition.parameterDescriptors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              _loop();
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }

        var inputChannelMergerNode = createNativeChannelMergerNode(nativeContext, {
          numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
        });
        var bufferSize = 512;
        var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, numberOfInputChannels + numberOfParameters, // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.
        Math.max(1, numberOfOutputChannels));
        var outputChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
          channelCount: Math.max(1, numberOfOutputChannels),
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          numberOfOutputs: Math.max(1, numberOfOutputChannels)
        });
        var outputChannelMergerNodes = [];

        for (var _i = 0; _i < options.numberOfOutputs; _i += 1) {
          outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeContext, {
            numberOfInputs: options.outputChannelCount[_i]
          }));
        }

        for (var _i2 = 0; _i2 < options.numberOfInputs; _i2 += 1) {
          gainNodes[_i2].connect(inputChannelSplitterNodes[_i2]);

          for (var j = 0; j < options.channelCount; j += 1) {
            inputChannelSplitterNodes[_i2].connect(inputChannelMergerNode, j, _i2 * options.channelCount + j);
          }
        }

        var parameterMap = new ReadOnlyMap(processorDefinition.parameterDescriptors === undefined ? [] : processorDefinition.parameterDescriptors.map(function (_ref, index) {
          var name = _ref.name;
          var constantSourceNode = constantSourceNodes[index];
          constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
          constantSourceNode.start(0);
          return [name, constantSourceNode.offset];
        }));
        inputChannelMergerNode.connect(scriptProcessorNode);

        if (options.numberOfOutputs > 0) {
          scriptProcessorNode.connect(outputChannelSplitterNode);
        }

        for (var _i3 = 0, outputChannelSplitterNodeOutput = 0; _i3 < options.numberOfOutputs; _i3 += 1) {
          var outputChannelMergerNode = outputChannelMergerNodes[_i3];

          for (var _j = 0; _j < options.outputChannelCount[_i3]; _j += 1) {
            outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + _j, _j);
          }

          outputChannelSplitterNodeOutput += options.outputChannelCount[_i3];
        }

        var onprocessorerror = null; // Bug #87: Expose at least one output to make this node connectable.

        var outputAudioNodes = options.numberOfOutputs === 0 ? [scriptProcessorNode] : outputChannelMergerNodes;
        var nativeAudioWorkletNodeFaker = {
          get bufferSize() {
            return bufferSize;
          },

          get channelCount() {
            return options.channelCount;
          },

          set channelCount(_) {
            // Bug #61: This is not part of the standard but required for the faker to work.
            throw createInvalidStateError();
          },

          get channelCountMode() {
            return options.channelCountMode;
          },

          set channelCountMode(_) {
            // Bug #61: This is not part of the standard but required for the faker to work.
            throw createInvalidStateError();
          },

          get channelInterpretation() {
            return gainNodes[0].channelInterpretation;
          },

          set channelInterpretation(value) {
            for (var _i4 = 0; _i4 < gainNodes.length; _i4++) {
              var gainNode = gainNodes[_i4];
              gainNode.channelInterpretation = value;
            }
          },

          get context() {
            return gainNodes[0].context;
          },

          get inputs() {
            return gainNodes;
          },

          get numberOfInputs() {
            return options.numberOfInputs;
          },

          get numberOfOutputs() {
            return options.numberOfOutputs;
          },

          get onprocessorerror() {
            return onprocessorerror;
          },

          set onprocessorerror(value) {
            if (value === null || typeof value === 'function') {
              onprocessorerror = value;
            } else {
              onprocessorerror = null;
            }
          },

          get parameters() {
            return parameterMap;
          },

          get port() {
            return messageChannel.port2;
          },

          addEventListener: function addEventListener() {
            return gainNodes[0].addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          connect: function connect() {
            return connectMultipleOutputs(outputAudioNodes, arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          disconnect: function disconnect() {
            return disconnectMultipleOutputs(outputAudioNodes, arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return gainNodes[0].dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return gainNodes[0].removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        processorDefinition.prototype.port = messageChannel.port1;
        var audioWorkletProcessor = null;
        var audioWorkletProcessorPromise = createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNodeFaker, processorDefinition, options);
        audioWorkletProcessorPromise.then(function (dWrkltPrcssr) {
          return audioWorkletProcessor = dWrkltPrcssr;
        });
        var inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
        var outputs = createNestedArrays(options.numberOfOutputs, options.outputChannelCount);
        var parameters = processorDefinition.parameterDescriptors === undefined ? [] : processorDefinition.parameterDescriptors.reduce(function (prmtrs, _ref2) {
          var name = _ref2.name;
          return Object.assign({}, prmtrs, _defineProperty({}, name, new Float32Array(128)));
        }, {});
        var isActive = true;

        scriptProcessorNode.onaudioprocess = function (_ref3) {
          var inputBuffer = _ref3.inputBuffer,
              outputBuffer = _ref3.outputBuffer;

          if (audioWorkletProcessor !== null) {
            var _loop2 = function _loop2(_i5) {
              for (var _j2 = 0; _j2 < options.numberOfInputs; _j2 += 1) {
                for (var k = 0; k < options.channelCount; k += 1) {
                  // Bug #5: Safari does not support copyFromChannel().
                  var slicedInputBuffer = inputBuffer.getChannelData(k).slice(_i5, _i5 + 128);

                  inputs[_j2][k].set(slicedInputBuffer);
                }
              }

              if (processorDefinition.parameterDescriptors !== undefined) {
                processorDefinition.parameterDescriptors.forEach(function (_ref4, index) {
                  var name = _ref4.name;
                  var slicedInputBuffer = inputBuffer.getChannelData(numberOfInputChannels + index).slice(_i5, _i5 + 128);
                  parameters[name].set(slicedInputBuffer);
                });
              }

              try {
                var audioNodeConnections = getAudioNodeConnections(nativeAudioWorkletNodeFaker);
                var potentiallyEmptyInputs = inputs.map(function (input, index) {
                  if (audioNodeConnections.inputs[index].size === 0) {
                    return [];
                  }

                  return input;
                });
                var activeSourceFlag = audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters);
                isActive = activeSourceFlag;

                for (var _j3 = 0, _outputChannelSplitterNodeOutput = 0; _j3 < options.numberOfOutputs; _j3 += 1) {
                  for (var _k = 0; _k < options.outputChannelCount[_j3]; _k += 1) {
                    // Bug #5: Safari does not support copyFromChannel().
                    outputBuffer.getChannelData(_outputChannelSplitterNodeOutput + _k).set(outputs[_j3][_k], _i5);
                  }

                  _outputChannelSplitterNodeOutput += options.outputChannelCount[_j3];
                }
              } catch (_a) {
                isActive = false;

                if (onprocessorerror !== null) {
                  onprocessorerror.call(null, new ErrorEvent('processorerror'));
                }
              }

              if (!isActive) {
                scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation

                return "break";
              }
            };

            for (var _i5 = 0; _i5 < bufferSize; _i5 += 128) {
              var _ret = _loop2(_i5);

              if (_ret === "break") break;
            }
          }
        };

        return nativeAudioWorkletNodeFaker;
      };
    };

    var createNativeBiquadFilterNodeFactory = function createNativeBiquadFilterNodeFactory(createNativeAudioNode) {
      return function (nativeContext, options) {
        var nativeBiquadFilterNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBiquadFilter();
        });
        assignNativeAudioNodeOptions(nativeBiquadFilterNode, options);

        if (options.Q !== nativeBiquadFilterNode.Q.value) {
          nativeBiquadFilterNode.Q.value = options.Q;
        }

        if (options.detune !== nativeBiquadFilterNode.detune.value) {
          nativeBiquadFilterNode.detune.value = options.detune;
        }

        if (options.frequency !== nativeBiquadFilterNode.frequency.value) {
          nativeBiquadFilterNode.frequency.value = options.frequency;
        }

        if (options.gain !== nativeBiquadFilterNode.gain.value) {
          nativeBiquadFilterNode.gain.value = options.gain;
        }

        if (options.type !== nativeBiquadFilterNode.type) {
          nativeBiquadFilterNode.type = options.type;
        }

        return nativeBiquadFilterNode;
      };
    };

    var createNativeChannelMergerNodeFactory = function createNativeChannelMergerNodeFactory(createNativeAudioNode, wrapChannelMergerNode) {
      return function (nativeContext) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var nativeChannelMergerNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createChannelMerger(options.numberOfInputs === undefined ? 6 : options.numberOfInputs);
        });
        assignNativeAudioNodeOptions(nativeChannelMergerNode, options); // Bug #15: Safari does not return the default properties.

        if (nativeChannelMergerNode.channelCount !== 1 && nativeChannelMergerNode.channelCountMode !== 'explicit') {
          wrapChannelMergerNode(nativeContext, nativeChannelMergerNode);
        } // Bug #16: Firefox does not throw an error when setting a different channelCount or channelCountMode.


        try {
          nativeChannelMergerNode.channelCount = options.numberOfInputs === undefined ? 6 : options.numberOfInputs;
          wrapChannelMergerNode(nativeContext, nativeChannelMergerNode);
        } catch (
        /* Ignore errors. */
        _a) {}
        /* Ignore errors. */
        // tslint:disable-line:no-empty


        return nativeChannelMergerNode;
      };
    };

    var wrapChannelSplitterNode = function wrapChannelSplitterNode(channelSplitterNode) {
      var channelCount = channelSplitterNode.numberOfOutputs; // Bug #96: Safari does not have the correct channelCount.

      if (channelSplitterNode.channelCount !== channelCount) {
        channelSplitterNode.channelCount = channelCount;
      } // Bug #29: Edge & Safari do not have the correct channelCountMode.


      if (channelSplitterNode.channelCountMode !== 'explicit') {
        channelSplitterNode.channelCountMode = 'explicit';
      } // Bug #31: Edge & Safari do not have the correct channelInterpretation.


      if (channelSplitterNode.channelInterpretation !== 'discrete') {
        channelSplitterNode.channelInterpretation = 'discrete';
      } // Bug #97: Safari does not throw an error when attempting to change the channelCount to something other than its initial value.


      Object.defineProperty(channelSplitterNode, 'channelCount', {
        get: function get() {
          return channelCount;
        },
        set: function set(value) {
          if (value !== channelCount) {
            throw createInvalidStateError();
          }
        }
      });
      /*
       * Bug #30: Only Chrome, Firefox & Opera throw an error when attempting to change the channelCountMode to something other than
       * explicit.
       */

      Object.defineProperty(channelSplitterNode, 'channelCountMode', {
        get: function get() {
          return 'explicit';
        },
        set: function set(value) {
          if (value !== 'explicit') {
            throw createInvalidStateError();
          }
        }
      });
      /*
       * Bug #32: Only Chrome, Firefox & Opera throws an error when attempting to change the channelInterpretation to something other than
       * discrete.
       */

      Object.defineProperty(channelSplitterNode, 'channelInterpretation', {
        get: function get() {
          return 'discrete';
        },
        set: function set(value) {
          if (value !== 'discrete') {
            throw createInvalidStateError();
          }
        }
      });
    };

    var createNativeChannelSplitterNodeFactory = function createNativeChannelSplitterNodeFactory(createNativeAudioNode) {
      return function (nativeContext, options) {
        var nativeChannelSplitterNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createChannelSplitter(options.numberOfOutputs);
        }); // Bug #29, #30, #31, #32, #96 & #97: Only Chrome, Firefox & Opera partially support the spec yet.

        wrapChannelSplitterNode(nativeChannelSplitterNode);
        return nativeChannelSplitterNode;
      };
    };

    var createNativeConstantSourceNodeFactory = function createNativeConstantSourceNodeFactory(createNativeAudioNode, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, testConstantSourceNodeAccurateSchedulingSupport, wrapConstantSourceNodeAccurateScheduling) {
      return function (nativeContext, options) {
        // Bug #62: Edge & Safari do not support ConstantSourceNodes.
        // @todo TypeScript doesn't know yet about createConstantSource().
        if (nativeContext.createConstantSource === undefined) {
          return createNativeConstantSourceNodeFaker(nativeContext, options);
        }

        var nativeConstantSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createConstantSource();
        });
        assignNativeAudioNodeOptions(nativeConstantSourceNode, options);

        if (options.offset !== nativeConstantSourceNode.offset.value) {
          nativeConstantSourceNode.offset.value = options.offset;
        } // Bug #44: Only Chrome & Opera throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeConstantSourceNode);
        } // Bug #44: No browser does throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeConstantSourceNode);
        } // Bug #70: Firefox does not schedule ConstantSourceNodes accurately.


        if (!cacheTestResult(testConstantSourceNodeAccurateSchedulingSupport, function () {
          return testConstantSourceNodeAccurateSchedulingSupport(nativeContext);
        })) {
          wrapConstantSourceNodeAccurateScheduling(nativeConstantSourceNode, nativeContext);
        }

        return nativeConstantSourceNode;
      };
    };

    var interceptConnections = function interceptConnections(original, interceptor) {
      original.connect = function (destination) {
        var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        if (destination instanceof AudioNode) {
          interceptor.connect.call(interceptor, destination, output, input); // Bug #11: Safari does not support chaining yet.

          return destination;
        } // @todo This return statement is necessary to satisfy TypeScript.


        return interceptor.connect.call(interceptor, destination, output);
      };

      original.disconnect = function () {
        interceptor.disconnect.apply(interceptor, arguments);
      };

      return original;
    };

    var createNativeConstantSourceNodeFakerFactory = function createNativeConstantSourceNodeFakerFactory(createNativeAudioBufferSourceNode, createNativeGainNode) {
      return function (nativeContext, _a) {
        var offset = _a.offset,
            audioNodeOptions = tslib_1.__rest(_a, ["offset"]);

        var audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext);
        /*
         * @todo Edge will throw a NotSupportedError when calling createBuffer() on a closed context. That's why the audioBuffer is created
         * after the audioBufferSourceNode in this case. If the context is closed createNativeAudioBufferSourceNode() will throw the
         * expected error and createBuffer() never gets called.
         */

        var audioBuffer = nativeContext.createBuffer(1, 2, nativeContext.sampleRate);
        var gainNode = createNativeGainNode(nativeContext, Object.assign({}, audioNodeOptions, {
          gain: offset
        })); // Bug #5: Safari does not support copyFromChannel() and copyToChannel().

        var channelData = audioBuffer.getChannelData(0); // Bug #95: Safari does not play or loop one sample buffers.

        channelData[0] = 1;
        channelData[1] = 1;
        audioBufferSourceNode.buffer = audioBuffer;
        audioBufferSourceNode.loop = true;
        audioBufferSourceNode.connect(gainNode);
        var nativeConstantSourceNodeFaker = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return gainNode.channelCount;
          },

          set channelCount(value) {
            gainNode.channelCount = value;
          },

          get channelCountMode() {
            return gainNode.channelCountMode;
          },

          set channelCountMode(value) {
            gainNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return gainNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            gainNode.channelInterpretation = value;
          },

          get context() {
            return gainNode.context;
          },

          get inputs() {
            return undefined;
          },

          get numberOfInputs() {
            return audioBufferSourceNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return gainNode.numberOfOutputs;
          },

          get offset() {
            return gainNode.gain;
          },

          get onended() {
            return audioBufferSourceNode.onended;
          },

          set onended(value) {
            audioBufferSourceNode.onended = value;
          },

          addEventListener: function addEventListener() {
            return audioBufferSourceNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return audioBufferSourceNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return audioBufferSourceNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          start: function start() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            audioBufferSourceNode.start.call(audioBufferSourceNode, when);
          },
          stop: function stop() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            audioBufferSourceNode.stop.call(audioBufferSourceNode, when);
          }
        };
        return interceptConnections(nativeConstantSourceNodeFaker, gainNode);
      };
    };

    var createNativeGainNodeFactory = function createNativeGainNodeFactory(createNativeAudioNode) {
      return function (nativeContext, options) {
        var nativeGainNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createGain();
        });
        assignNativeAudioNodeOptions(nativeGainNode, options);

        if (options.gain !== nativeGainNode.gain.value) {
          nativeGainNode.gain.value = options.gain;
        }

        return nativeGainNode;
      };
    };

    var createNativeIIRFilterNodeFactory = function createNativeIIRFilterNodeFactory(createNativeAudioNode, createNativeIIRFilterNodeFaker) {
      return function (nativeContext, options) {
        // Bug #9: Safari does not support IIRFilterNodes.
        if (nativeContext.createIIRFilter === undefined) {
          return createNativeIIRFilterNodeFaker(nativeContext, options);
        }

        var nativeIIRFilterNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createIIRFilter(options.feedforward, options.feedback);
        });
        assignNativeAudioNodeOptions(nativeIIRFilterNode, options);
        return nativeIIRFilterNode;
      };
    };

    function divide(a, b) {
      var denominator = b[0] * b[0] + b[1] * b[1];
      return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
    }

    function multiply(a, b) {
      return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    }

    function evaluatePolynomial(coefficient, z) {
      var result = [0, 0];

      for (var i = coefficient.length - 1; i >= 0; i -= 1) {
        result = multiply(result, z);
        result[0] += coefficient[i];
      }

      return result;
    }

    var createNativeIIRFilterNodeFakerFactory = function createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError) {
      return function (nativeContext, _ref) {
        var channelCount = _ref.channelCount,
            channelCountMode = _ref.channelCountMode,
            channelInterpretation = _ref.channelInterpretation,
            feedback = _ref.feedback,
            feedforward = _ref.feedforward;
        var bufferSize = 256;
        var feedbackLength = feedback.length;
        var feedforwardLength = feedforward.length;
        var minLength = Math.min(feedbackLength, feedforwardLength);

        if (feedback.length === 0 || feedback.length > 20) {
          throw createNotSupportedError();
        }

        if (feedback[0] === 0) {
          throw createInvalidStateError();
        }

        if (feedforward.length === 0 || feedforward.length > 20) {
          throw createNotSupportedError();
        }

        if (feedforward[0] === 0) {
          throw createInvalidStateError();
        }

        if (feedback[0] !== 1) {
          for (var i = 0; i < feedforwardLength; i += 1) {
            feedforward[i] /= feedback[0];
          }

          for (var _i = 1; _i < feedbackLength; _i += 1) {
            feedback[_i] /= feedback[0];
          }
        }

        var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, channelCount, channelCount);
        scriptProcessorNode.channelCount = channelCount;
        scriptProcessorNode.channelCountMode = channelCountMode;
        scriptProcessorNode.channelInterpretation = channelInterpretation;
        var bufferLength = 32;
        var bufferIndexes = [];
        var xBuffers = [];
        var yBuffers = [];

        for (var _i2 = 0; _i2 < channelCount; _i2 += 1) {
          bufferIndexes.push(0);
          var xBuffer = new Float32Array(bufferLength);
          var yBuffer = new Float32Array(bufferLength); // @todo Add a test which checks support for TypedArray.prototype.fill().

          xBuffer.fill(0);
          yBuffer.fill(0);
          xBuffers.push(xBuffer);
          yBuffers.push(yBuffer);
        }

        scriptProcessorNode.onaudioprocess = function (event) {
          var inputBuffer = event.inputBuffer;
          var outputBuffer = event.outputBuffer;
          var numberOfChannels = inputBuffer.numberOfChannels;

          for (var _i3 = 0; _i3 < numberOfChannels; _i3 += 1) {
            var input = inputBuffer.getChannelData(_i3);
            var output = outputBuffer.getChannelData(_i3);
            bufferIndexes[_i3] = filterBuffer(feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffers[_i3], yBuffers[_i3], bufferIndexes[_i3], bufferLength, input, output);
          }
        };

        var nyquist = nativeContext.sampleRate / 2;
        var nativeIIRFilterNodeFaker = {
          get bufferSize() {
            return bufferSize;
          },

          get channelCount() {
            return scriptProcessorNode.channelCount;
          },

          set channelCount(value) {
            scriptProcessorNode.channelCount = value;
          },

          get channelCountMode() {
            return scriptProcessorNode.channelCountMode;
          },

          set channelCountMode(value) {
            scriptProcessorNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return scriptProcessorNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            scriptProcessorNode.channelInterpretation = value;
          },

          get context() {
            return scriptProcessorNode.context;
          },

          get inputs() {
            return [scriptProcessorNode];
          },

          get numberOfInputs() {
            return scriptProcessorNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return scriptProcessorNode.numberOfOutputs;
          },

          addEventListener: function addEventListener() {
            // @todo Dissallow adding an audioprocess listener.
            return scriptProcessorNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return scriptProcessorNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          getFrequencyResponse: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
              throw createInvalidAccessError();
            }

            var length = frequencyHz.length;

            for (var _i4 = 0; _i4 < length; _i4 += 1) {
              var omega = -Math.PI * (frequencyHz[_i4] / nyquist);
              var z = [Math.cos(omega), Math.sin(omega)];
              var numerator = evaluatePolynomial(feedforward, z);
              var denominator = evaluatePolynomial(feedback, z);
              var response = divide(numerator, denominator);
              magResponse[_i4] = Math.sqrt(response[0] * response[0] + response[1] * response[1]);
              phaseResponse[_i4] = Math.atan2(response[1], response[0]);
            }
          },
          removeEventListener: function removeEventListener() {
            return scriptProcessorNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        return interceptConnections(nativeIIRFilterNodeFaker, scriptProcessorNode);
      };
    };

    var createNativeMediaElementAudioSourceNodeFactory = function createNativeMediaElementAudioSourceNodeFactory(createNativeAudioNode) {
      return function (nativeAudioContext, options) {
        return createNativeAudioNode(nativeAudioContext, function (ntvDCntxt) {
          return ntvDCntxt.createMediaElementSource(options.mediaElement);
        });
      };
    };

    var createNativeMediaStreamAudioSourceNodeFactory = function createNativeMediaStreamAudioSourceNodeFactory(createNativeAudioNode) {
      return function (nativeAudioContext, options) {
        return createNativeAudioNode(nativeAudioContext, function (ntvDCntxt) {
          return ntvDCntxt.createMediaStreamSource(options.mediaStream);
        });
      };
    };

    var createNativeOfflineAudioContextConstructor = function createNativeOfflineAudioContextConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('OfflineAudioContext')) {
        return window.OfflineAudioContext;
      }

      return window.hasOwnProperty('webkitOfflineAudioContext') ? window.webkitOfflineAudioContext : null;
    };

    var createNativeOscillatorNodeFactory = function createNativeOscillatorNodeFactory(createNativeAudioNode, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) {
      return function (nativeContext, options) {
        var nativeOscillatorNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createOscillator();
        });
        assignNativeAudioNodeOptions(nativeOscillatorNode, options);

        if (options.detune !== nativeOscillatorNode.detune.value) {
          nativeOscillatorNode.detune.value = options.detune;
        }

        if (options.frequency !== nativeOscillatorNode.frequency.value) {
          nativeOscillatorNode.frequency.value = options.frequency;
        } // @todo periodicWave


        if (options.type !== nativeOscillatorNode.type) {
          nativeOscillatorNode.type = options.type;
        } // Bug #44: Only Chrome & Opera throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeOscillatorNode);
        } // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, function () {
          return testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeOscillatorNode, nativeContext);
        } // Bug #44: No browser does throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeOscillatorNode);
        }

        return nativeOscillatorNode;
      };
    };

    var createNativeScriptProcessorNodeFactory = function createNativeScriptProcessorNodeFactory(createNativeAudioNode) {
      return function (nativeContext, bufferSize, numberOfInputChannels, numberOfOutputChannels) {
        return createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        });
      };
    };

    var createNativeStereoPannerNodeFactory = function createNativeStereoPannerNodeFactory(createNativeAudioNode, createNativeStereoPannerNodeFaker, createNotSupportedError) {
      return function (nativeContext, options) {
        return createNativeAudioNode(nativeContext, function (ntvCntxt) {
          var channelCountMode = options.channelCountMode;
          /*
           * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
           * which supports it and therefore it can't be supported at all.
           */

          if (options.channelCountMode === 'clamped-max') {
            throw createNotSupportedError();
          } // Bug #105: Safari does not support the StereoPannerNode.


          if (nativeContext.createStereoPanner === undefined) {
            return createNativeStereoPannerNodeFaker(nativeContext, options);
          }

          var nativeStereoPannerNode = ntvCntxt.createStereoPanner();
          assignNativeAudioNodeOptions(nativeStereoPannerNode, options);

          if (options.pan !== nativeStereoPannerNode.pan.value) {
            nativeStereoPannerNode.pan.value = options.pan;
          } // Bug #107: Firefox does not kick off the processing of the StereoPannerNode if the value of pan is zero.


          if (options.pan === 0) {
            var gainNode = ntvCntxt.createGain();
            gainNode.connect(nativeStereoPannerNode.pan);
          }
          /*
           * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
           * which supports it and therefore it can't be supported at all.
           */


          Object.defineProperty(nativeStereoPannerNode, 'channelCountMode', {
            get: function get() {
              return channelCountMode;
            },
            set: function set(value) {
              if (value !== channelCountMode) {
                throw createNotSupportedError();
              }
            }
          });
          return nativeStereoPannerNode;
        });
      };
    };

    var createNativeStereoPannerNodeFakerFactory = function createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError) {
      // The curve has a size of 14bit plus 1 value to have an exact representation for zero. This value has been determined experimentally.
      var CURVE_SIZE = 16385;
      var DC_CURVE = new Float32Array([1, 1]);
      var HALF_PI = Math.PI / 2;
      var SINGLE_CHANNEL_OPTIONS = {
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete'
      };
      var SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS = Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
        oversample: 'none'
      });

      var buildInternalGraphForMono = function buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode) {
        var leftWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightWaveShaperCurve = new Float32Array(CURVE_SIZE);

        for (var i = 0; i < CURVE_SIZE; i += 1) {
          var x = i / (CURVE_SIZE - 1) * HALF_PI;
          leftWaveShaperCurve[i] = Math.cos(x);
          rightWaveShaperCurve[i] = Math.sin(x);
        }

        var leftGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var leftWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: leftWaveShaperCurve
        }));
        var panWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: DC_CURVE
        }));
        var rightGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var rightWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: rightWaveShaperCurve
        }));
        inputGainNode.connect(leftGainNode);
        inputGainNode.connect(panWaveShaperNode);
        inputGainNode.connect(rightGainNode);
        panWaveShaperNode.connect(panGainNode);
        panGainNode.connect(leftWaveShaperNode);
        panGainNode.connect(rightWaveShaperNode);
        leftWaveShaperNode.connect(leftGainNode.gain);
        rightWaveShaperNode.connect(rightGainNode.gain);
        leftGainNode.connect(channelMergerNode, 0, 0);
        rightGainNode.connect(channelMergerNode, 0, 1);
        return [leftGainNode, rightGainNode];
      };

      var buildInternalGraphForStereo = function buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode) {
        var leftInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var leftInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var centerIndex = Math.floor(CURVE_SIZE / 2);

        for (var i = 0; i < CURVE_SIZE; i += 1) {
          if (i > centerIndex) {
            var x = (i - centerIndex) / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;
            leftInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
            leftInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
            rightInputForLeftOutputWaveShaperCurve[i] = 0;
            rightInputForRightOutputWaveShaperCurve[i] = 1;
          } else {
            var _x = i / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;

            leftInputForLeftOutputWaveShaperCurve[i] = 1;
            leftInputForRightOutputWaveShaperCurve[i] = 0;
            rightInputForLeftOutputWaveShaperCurve[i] = Math.cos(_x);
            rightInputForRightOutputWaveShaperCurve[i] = Math.sin(_x);
          }
        }

        var channelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
          channelCount: 2,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          numberOfOutputs: 2
        });
        var leftInputForLeftOutputGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var leftInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: leftInputForLeftOutputWaveShaperCurve
        }));
        var leftInputForRightOutputGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var leftInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: leftInputForRightOutputWaveShaperCurve
        }));
        var panWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: DC_CURVE
        }));
        var rightInputForLeftOutputGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var rightInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: rightInputForLeftOutputWaveShaperCurve
        }));
        var rightInputForRightOutputGainNode = createNativeGainNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_OPTIONS, {
          gain: 0
        }));
        var rightInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, Object.assign({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS, {
          curve: rightInputForRightOutputWaveShaperCurve
        }));
        inputGainNode.connect(channelSplitterNode);
        inputGainNode.connect(panWaveShaperNode);
        channelSplitterNode.connect(leftInputForLeftOutputGainNode, 1);
        channelSplitterNode.connect(leftInputForRightOutputGainNode, 1);
        channelSplitterNode.connect(rightInputForLeftOutputGainNode, 1);
        channelSplitterNode.connect(rightInputForRightOutputGainNode, 1);
        panWaveShaperNode.connect(panGainNode);
        panGainNode.connect(leftInputForLeftOutputWaveShaperNode);
        panGainNode.connect(leftInputForRightOutputWaveShaperNode);
        panGainNode.connect(rightInputForLeftOutputWaveShaperNode);
        panGainNode.connect(rightInputForRightOutputWaveShaperNode);
        leftInputForLeftOutputWaveShaperNode.connect(leftInputForLeftOutputGainNode.gain);
        leftInputForRightOutputWaveShaperNode.connect(leftInputForRightOutputGainNode.gain);
        rightInputForLeftOutputWaveShaperNode.connect(rightInputForLeftOutputGainNode.gain);
        rightInputForRightOutputWaveShaperNode.connect(rightInputForRightOutputGainNode.gain);
        leftInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
        rightInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
        leftInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
        rightInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
        return [leftInputForLeftOutputGainNode, rightInputForLeftOutputGainNode, leftInputForRightOutputGainNode, rightInputForRightOutputGainNode];
      };

      var buildInternalGraph = function buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode) {
        if (channelCount === 1) {
          return buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        } else if (channelCount === 2) {
          return buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        }

        throw createNotSupportedError();
      };

      return function (nativeContext, _a) {
        var channelCount = _a.channelCount,
            channelCountMode = _a.channelCountMode,
            pan = _a.pan,
            audioNodeOptions = tslib_1.__rest(_a, ["channelCount", "channelCountMode", "pan"]);

        if (channelCountMode === 'max') {
          throw createNotSupportedError();
        }

        var channelMergerNode = createNativeChannelMergerNode(nativeContext, Object.assign({}, audioNodeOptions, {
          channelCount: 1,
          channelCountMode: channelCountMode,
          numberOfInputs: 2
        }));
        var inputGainNode = createNativeGainNode(nativeContext, Object.assign({}, audioNodeOptions, {
          channelCount: channelCount,
          channelCountMode: channelCountMode,
          gain: 1
        }));
        var panGainNode = createNativeGainNode(nativeContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          gain: pan
        });
        var outputNodes = buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode);
        var panAudioParam = Object.defineProperties(panGainNode.gain, {
          defaultValue: {
            get: function get() {
              return 0;
            }
          }
        });
        var nativeStereoPannerNodeFakerFactory = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return inputGainNode.channelCount;
          },

          set channelCount(value) {
            if (inputGainNode.channelCount !== value) {
              inputGainNode.disconnect();
              outputNodes.forEach(function (outputNode) {
                return outputNode.disconnect();
              });
              outputNodes = buildInternalGraph(nativeContext, value, inputGainNode, panGainNode, channelMergerNode);
            }

            inputGainNode.channelCount = value;
          },

          get channelCountMode() {
            return inputGainNode.channelCountMode;
          },

          set channelCountMode(value) {
            if (value === 'clamped-max' || value === 'max') {
              throw createNotSupportedError();
            }

            inputGainNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return inputGainNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            inputGainNode.channelInterpretation = value;
          },

          get context() {
            return inputGainNode.context;
          },

          get inputs() {
            return [inputGainNode];
          },

          get numberOfInputs() {
            return inputGainNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return inputGainNode.numberOfOutputs;
          },

          get pan() {
            return panAudioParam;
          },

          addEventListener: function addEventListener() {
            return inputGainNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return inputGainNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return inputGainNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        return interceptConnections(nativeStereoPannerNodeFakerFactory, channelMergerNode);
      };
    };

    var createNativeWaveShaperNodeFactory = function createNativeWaveShaperNodeFactory(createInvalidStateError, createNativeAudioNode) {
      return function (nativeContext, options) {
        return createNativeAudioNode(nativeContext, function (ntvCntxt) {
          var nativeWaveShaperNode = ntvCntxt.createWaveShaper();
          assignNativeAudioNodeOptions(nativeWaveShaperNode, options);

          if (options.curve !== nativeWaveShaperNode.curve) {
            var curve = options.curve; // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
            // Bug #104: Chrome will throw an InvalidAccessError when the curve has less than two samples.

            if (curve !== null && curve.length < 2) {
              throw createInvalidStateError();
            }

            nativeWaveShaperNode.curve = curve;
          }

          if (options.oversample !== nativeWaveShaperNode.oversample) {
            nativeWaveShaperNode.oversample = options.oversample;
          }

          return nativeWaveShaperNode;
        });
      };
    };

    var createNoneAudioDestinationNodeConstructor = function createNoneAudioDestinationNodeConstructor(audioNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_audioNodeConstructor) {
          _inherits(NoneAudioDestinationNode, _audioNodeConstructor);

          function NoneAudioDestinationNode(context, nativeAudioNode, audioNodeRenderer) {
            _classCallCheck(this, NoneAudioDestinationNode);

            return _possibleConstructorReturn(this, _getPrototypeOf(NoneAudioDestinationNode).call(this, context, nativeAudioNode, audioNodeRenderer));
          }

          return NoneAudioDestinationNode;
        }(audioNodeConstructor)
      );
    };

    var createNotSupportedError = function createNotSupportedError() {
      try {
        return new DOMException('', 'NotSupportedError');
      } catch (err) {
        err.code = 9;
        err.name = 'NotSupportedError';
        return err;
      }
    };

    var DEFAULT_OPTIONS$d = {
      numberOfChannels: 1
    };
    var createOfflineAudioContextConstructor = function createOfflineAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, nativeOfflineAudioContextConstructor, _startRendering) {
      return (
        /*#__PURE__*/
        function (_baseAudioContextCons) {
          _inherits(OfflineAudioContext, _baseAudioContextCons);

          function OfflineAudioContext(a, b, c) {
            var _this;

            _classCallCheck(this, OfflineAudioContext);

            if (nativeOfflineAudioContextConstructor === null) {
              throw new Error(); // @todo
            }

            var options;

            if (typeof a === 'number' && b !== undefined && c !== undefined) {
              options = {
                length: b,
                numberOfChannels: a,
                sampleRate: c
              };
            } else if (_typeof(a) === 'object') {
              options = a;
            } else {
              throw new Error('The given parameters are not valid.');
            }

            var _Object$assign = Object.assign({}, DEFAULT_OPTIONS$d, options),
                length = _Object$assign.length,
                numberOfChannels = _Object$assign.numberOfChannels,
                sampleRate = _Object$assign.sampleRate;

            var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(numberOfChannels, length, sampleRate); // #21 Safari does not support promises and therefore would fire the statechange event before the promise can be resolved.

            if (!cacheTestResult(testPromiseSupport, function () {
              return testPromiseSupport(nativeOfflineAudioContext);
            })) {
              nativeOfflineAudioContext.addEventListener('statechange', function () {
                var i = 0;

                var delayStateChangeEvent = function delayStateChangeEvent(event) {
                  if (_this._state === 'running') {
                    if (i > 0) {
                      nativeOfflineAudioContext.removeEventListener('statechange', delayStateChangeEvent);
                      event.stopImmediatePropagation();

                      _this._waitForThePromiseToSettle(event);
                    } else {
                      i += 1;
                    }
                  }
                };

                return delayStateChangeEvent;
              }());
            }

            _this = _possibleConstructorReturn(this, _getPrototypeOf(OfflineAudioContext).call(this, nativeOfflineAudioContext, numberOfChannels));
            _this._length = length;
            _this._nativeOfflineAudioContext = nativeOfflineAudioContext;
            _this._state = null;
            return _this;
          }

          _createClass(OfflineAudioContext, [{
            key: "startRendering",
            value: function startRendering() {
              var _this2 = this;

              /*
               * Bug #9 & #59: It is theoretically possible that startRendering() will first render a partialOfflineAudioContext. Therefore
               * the state of the nativeOfflineAudioContext might no transition to running immediately.
               */
              if (this._state === 'running') {
                return Promise.reject(createInvalidStateError());
              }

              this._state = 'running';
              return _startRendering(this.destination, this._nativeOfflineAudioContext).then(function (audioBuffer) {
                _this2._state = null;
                /*
                 * Bug #50: Deleting the AudioGraph is currently not possible anymore.
                 * deleteAudioGraph(this, this._nativeOfflineAudioContext);
                 */

                return audioBuffer;
              }) // @todo This could be written more elegantly when Promise.finally() becomes avalaible.
              .catch(function (err) {
                _this2._state = null;
                /*
                 * Bug #50: Deleting the AudioGraph is currently not possible anymore.
                 * deleteAudioGraph(this, this._nativeOfflineAudioContext);
                 */

                throw err; // tslint:disable-line:rxjs-throw-error
              });
            }
          }, {
            key: "_waitForThePromiseToSettle",
            value: function _waitForThePromiseToSettle(event) {
              var _this3 = this;

              if (this._state === null) {
                this._nativeOfflineAudioContext.dispatchEvent(event);
              } else {
                setTimeout(function () {
                  return _this3._waitForThePromiseToSettle(event);
                });
              }
            }
          }, {
            key: "length",
            get: function get() {
              // Bug #17: Safari does not yet expose the length.
              if (this._nativeOfflineAudioContext.length === undefined) {
                return this._length;
              }

              return this._nativeOfflineAudioContext.length;
            }
          }, {
            key: "state",
            get: function get() {
              return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
            }
          }]);

          return OfflineAudioContext;
        }(baseAudioContextConstructor)
      );
    };

    var DEFAULT_OPTIONS$e = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      detune: 0,
      frequency: 440,
      type: 'sine'
    };
    var createOscillatorNodeConstructor = function createOscillatorNodeConstructor(createAudioParam, createInvalidStateError, createNativeOscillatorNode, createOscillatorNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(OscillatorNode, _noneAudioDestination);

          function OscillatorNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$e;

            _classCallCheck(this, OscillatorNode);

            var absoluteValue = 1200 * Math.log2(context.sampleRate);
            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$e, options);
            var nativeOscillatorNode = createNativeOscillatorNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var oscillatorNodeRenderer = isOffline ? createOscillatorNodeRenderer() : null;
            var nyquist = context.sampleRate / 2;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(OscillatorNode).call(this, context, nativeOscillatorNode, oscillatorNodeRenderer)); // Bug #81: Edge, Firefox & Safari do not export the correct values for maxValue and minValue.

            _this._detune = createAudioParam(context, isOffline, nativeOscillatorNode.detune, absoluteValue, -absoluteValue); // Bug #76: Edge & Safari do not export the correct values for maxValue and minValue.

            _this._frequency = createAudioParam(context, isOffline, nativeOscillatorNode.frequency, nyquist, -nyquist);
            _this._nativeOscillatorNode = nativeOscillatorNode;
            _this._oscillatorNodeRenderer = oscillatorNodeRenderer;
            return _this;
          }

          _createClass(OscillatorNode, [{
            key: "setPeriodicWave",
            value: function setPeriodicWave(periodicWave) {
              this._nativeOscillatorNode.setPeriodicWave(periodicWave);
            }
          }, {
            key: "start",
            value: function start() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              this._nativeOscillatorNode.start(when);

              if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.start = when;
              }
            }
          }, {
            key: "stop",
            value: function stop() {
              var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

              this._nativeOscillatorNode.stop(when);

              if (this._oscillatorNodeRenderer !== null) {
                this._oscillatorNodeRenderer.stop = when;
              }
            }
          }, {
            key: "detune",
            get: function get() {
              return this._detune;
            }
          }, {
            key: "frequency",
            get: function get() {
              return this._frequency;
            }
          }, {
            key: "onended",
            get: function get() {
              return this._nativeOscillatorNode.onended;
            },
            set: function set(value) {
              this._nativeOscillatorNode.onended = value;
            }
          }, {
            key: "type",
            get: function get() {
              return this._nativeOscillatorNode.type;
            },
            set: function set(value) {
              this._nativeOscillatorNode.type = value; // Bug #57: Edge will not throw an error when assigning the type to 'custom'. But it still will change the value.

              if (value === 'custom') {
                throw createInvalidStateError();
              }
            }
          }]);

          return OscillatorNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createOscillatorNodeRendererFactory = function createOscillatorNodeRendererFactory(createNativeOscillatorNode) {
      return function () {
        var nativeOscillatorNode = null;
        var start = null;
        var stop = null;
        return {
          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeOscillatorNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeOscillatorNode);

                    case 2:
                      nativeOscillatorNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeOscillatorNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */

                      if (isOwnedByContext(nativeOscillatorNode, nativeOfflineAudioContext)) {
                        _context.next = 14;
                        break;
                      }

                      options = {
                        channelCount: nativeOscillatorNode.channelCount,
                        channelCountMode: nativeOscillatorNode.channelCountMode,
                        channelInterpretation: nativeOscillatorNode.channelInterpretation,
                        detune: nativeOscillatorNode.detune.value,
                        frequency: nativeOscillatorNode.frequency.value,
                        // @todo periodicWave is not exposed by the native node.
                        type: nativeOscillatorNode.type
                      };
                      nativeOscillatorNode = createNativeOscillatorNode(nativeOfflineAudioContext, options);

                      if (start !== null) {
                        nativeOscillatorNode.start(start);
                      }

                      if (stop !== null) {
                        nativeOscillatorNode.stop(stop);
                      }

                      _context.next = 10;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune);

                    case 10:
                      _context.next = 12;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency);

                    case 12:
                      _context.next = 18;
                      break;

                    case 14:
                      _context.next = 16;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.detune);

                    case 16:
                      _context.next = 18;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.frequency);

                    case 18:
                      _context.next = 20;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeOscillatorNode);

                    case 20:
                      return _context.abrupt("return", nativeOscillatorNode);

                    case 21:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createRenderNativeOfflineAudioContext = function createRenderNativeOfflineAudioContext(createNativeGainNode) {
      return function (nativeOfflineAudioContext) {
        // Bug #21: Safari does not support promises yet.
        if (cacheTestResult(testPromiseSupport, function () {
          return testPromiseSupport(nativeOfflineAudioContext);
        })) {
          return nativeOfflineAudioContext.startRendering();
        }

        return new Promise(function (resolve) {
          // Bug #48: Safari does not render an OfflineAudioContext without any connected node.
          var gainNode = createNativeGainNode(nativeOfflineAudioContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: 0
          });

          nativeOfflineAudioContext.oncomplete = function (event) {
            gainNode.disconnect();
            resolve(event.renderedBuffer);
          };

          gainNode.connect(nativeOfflineAudioContext.destination);
          nativeOfflineAudioContext.startRendering();
        });
      };
    };

    var createStartRendering = function createStartRendering(renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsSubarraySupport) {
      return function (destination, nativeOfflineAudioContext) {
        return getAudioNodeRenderer(destination).render(destination, nativeOfflineAudioContext).then(function () {
          return renderNativeOfflineAudioContext(nativeOfflineAudioContext);
        }).then(function (audioBuffer) {
          // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
          // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
          if (typeof audioBuffer.copyFromChannel !== 'function') {
            wrapAudioBufferCopyChannelMethods(audioBuffer);
            wrapAudioBufferGetChannelDataMethod(audioBuffer); // Bug #42: Firefox does not yet fully support copyFromChannel() and copyToChannel().
          } else if (!cacheTestResult(testAudioBufferCopyChannelMethodsSubarraySupport, function () {
            return testAudioBufferCopyChannelMethodsSubarraySupport(audioBuffer);
          })) {
            wrapAudioBufferCopyChannelMethodsSubarray(audioBuffer);
          }

          return audioBuffer;
        });
      };
    };

    var DEFAULT_OPTIONS$f = {
      channelCount: 2,

      /*
       * Bug #105: The channelCountMode should be 'clamped-max' according to the spec but is set to 'explicit' to achieve consistent
       * behavior.
       */
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      pan: 0
    };
    var createStereoPannerNodeConstructor = function createStereoPannerNodeConstructor(createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(StereoPannerNode, _noneAudioDestination);

          function StereoPannerNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$f;

            _classCallCheck(this, StereoPannerNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$f, options);
            var nativeStereoPannerNode = createNativeStereoPannerNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var stereoPannerNodeRenderer = isOffline ? createStereoPannerNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(StereoPannerNode).call(this, context, nativeStereoPannerNode, stereoPannerNodeRenderer)); // Bug #106: Edge does not export a maxValue and minValue property.

            _this._pan = createAudioParam(context, isOffline, nativeStereoPannerNode.pan, 1, -1);
            return _this;
          }

          _createClass(StereoPannerNode, [{
            key: "pan",
            get: function get() {
              return this._pan;
            }
          }]);

          return StereoPannerNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createStereoPannerNodeRendererFactory = function createStereoPannerNodeRendererFactory(createNativeStereoPannerNode) {
      return function () {
        var nativeStereoPannerNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeStereoPannerNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeStereoPannerNode);

                    case 2:
                      nativeStereoPannerNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeStereoPannerNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */

                      if (isOwnedByContext(nativeStereoPannerNode, nativeOfflineAudioContext)) {
                        _context.next = 10;
                        break;
                      }

                      options = {
                        channelCount: nativeStereoPannerNode.channelCount,
                        channelCountMode: nativeStereoPannerNode.channelCountMode,
                        channelInterpretation: nativeStereoPannerNode.channelInterpretation,
                        pan: nativeStereoPannerNode.pan.value
                      };
                      nativeStereoPannerNode = createNativeStereoPannerNode(nativeOfflineAudioContext, options);
                      _context.next = 8;
                      return renderAutomation(proxy.context, nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan);

                    case 8:
                      _context.next = 12;
                      break;

                    case 10:
                      _context.next = 12;
                      return connectAudioParam(proxy.context, nativeOfflineAudioContext, proxy.pan);

                    case 12:
                      if (!(nativeStereoPannerNode.inputs !== undefined)) {
                        _context.next = 17;
                        break;
                      }

                      _context.next = 15;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode.inputs[0]);

                    case 15:
                      _context.next = 19;
                      break;

                    case 17:
                      _context.next = 19;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode);

                    case 19:
                      return _context.abrupt("return", nativeStereoPannerNode);

                    case 20:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    // Bug #33: Edge & Safari expose an AudioBuffer but it can't be used as a constructor.
    var createTestAudioBufferConstructorSupport = function createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor) {
      return function () {
        if (nativeAudioBufferConstructor === null) {
          return false;
        }

        try {
          new nativeAudioBufferConstructor({
            length: 1,
            sampleRate: 44100
          }); // tslint:disable-line:no-unused-expression
        } catch (_a) {
          return false;
        }

        return true;
      };
    };

    var createTestAudioBufferSourceNodeStartMethodConsecutiveCallsSupport = function createTestAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(createNativeAudioNode) {
      return function (nativeContext) {
        var nativeAudioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });
        nativeAudioBufferSourceNode.start();

        try {
          nativeAudioBufferSourceNode.start();
        } catch (_a) {
          return true;
        }

        return false;
      };
    };

    // Bug #92: Edge does not respect the duration parameter yet.
    var createTestAudioBufferSourceNodeStartMethodDurationParameterSupport = function createTestAudioBufferSourceNodeStartMethodDurationParameterSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var audioBuffer = offlineAudioContext.createBuffer(1, 1, offlineAudioContext.sampleRate);
        var audioBufferSourceNode = offlineAudioContext.createBufferSource();
        audioBuffer.getChannelData(0)[0] = 1;
        audioBufferSourceNode.buffer = audioBuffer;
        audioBufferSourceNode.start(0, 0, 0);
        audioBufferSourceNode.connect(offlineAudioContext.destination); // Bug #21: Safari does not support promises yet.

        return new Promise(function (resolve) {
          offlineAudioContext.oncomplete = function (_ref) {
            var renderedBuffer = _ref.renderedBuffer;
            // Bug #5: Safari does not support copyFromChannel().
            resolve(renderedBuffer.getChannelData(0)[0] === 0);
          };

          offlineAudioContext.startRendering();
        });
      };
    };

    var createTestAudioContextCloseMethodSupport = function createTestAudioContextCloseMethodSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return false;
        } // Try to check the prototype before constructing the AudioContext.


        if (nativeAudioContextConstructor.prototype !== undefined && nativeAudioContextConstructor.prototype.close !== undefined) {
          return true;
        }

        var audioContext = new nativeAudioContextConstructor();
        var isAudioContextClosable = audioContext.close !== undefined;

        try {
          audioContext.close();
        } catch (_a) {// Ignore errors.
        }

        return isAudioContextClosable;
      };
    };

    /**
     * Edge up to version 14, Firefox up to version 52, Safari up to version 9 and maybe other browsers
     * did not refuse to decode invalid parameters with a TypeError.
     */
    var createTestAudioContextDecodeAudioDataMethodTypeErrorSupport = function createTestAudioContextDecodeAudioDataMethodTypeErrorSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100); // Bug #21: Safari does not support promises yet.

        return new Promise(function (resolve) {
          offlineAudioContext // Bug #1: Safari requires a successCallback.
          .decodeAudioData(null, function () {// Ignore the success callback.
          }, function (err) {
            offlineAudioContext.startRendering();
            resolve(err instanceof TypeError);
          }).catch(function () {// Ignore errors.
          });
        });
      };
    };

    var createTestAudioContextOptionsSupport = function createTestAudioContextOptionsSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return false;
        }

        var audioContext;

        try {
          audioContext = new nativeAudioContextConstructor({
            latencyHint: 'balanced'
          });
        } catch (_a) {
          return false;
        }

        audioContext.close();
        return true;
      };
    };

    var createTestAudioScheduledSourceNodeStartMethodNegativeParametersSupport = function createTestAudioScheduledSourceNodeStartMethodNegativeParametersSupport(createNativeAudioNode) {
      return function (nativeContext) {
        var nativeAudioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });

        try {
          nativeAudioBufferSourceNode.start(-1);
        } catch (err) {
          return err instanceof RangeError;
        }

        return false;
      };
    };

    var createTestAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport = function createTestAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(createNativeAudioNode) {
      return function (nativeContext) {
        var nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
        var nativeAudioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });
        nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
        nativeAudioBufferSourceNode.start();
        nativeAudioBufferSourceNode.stop();

        try {
          nativeAudioBufferSourceNode.stop();
          return true;
        } catch (_a) {
          return false;
        }
      };
    };

    var createTestAudioScheduledSourceNodeStopMethodNegativeParametersSupport = function createTestAudioScheduledSourceNodeStopMethodNegativeParametersSupport(createNativeAudioNode) {
      return function (nativeContext) {
        var nativeAudioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });

        try {
          nativeAudioBufferSourceNode.stop(-1);
        } catch (err) {
          return err instanceof RangeError;
        }

        return false;
      };
    };

    /**
     * Firefox up to version 44 had a bug which resulted in a misbehaving ChannelMergerNode. If one of
     * its channels would be unconnected the remaining channels were somehow upmixed to spread the
     * signal across all available channels.
     */
    var createTestChannelMergerNodeSupport = function createTestChannelMergerNodeSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var audioContext = new nativeAudioContextConstructor();
        var audioBuffer = audioContext.createBuffer(2, 2, audioContext.sampleRate);
        var audioBufferSourceNode = audioContext.createBufferSource();
        var channelMergerNode = audioContext.createChannelMerger(2);
        var scriptProcessorNode = audioContext.createScriptProcessor(256);
        return new Promise(function (resolve) {
          var startTime; // Bug #95: Safari does not play/loop one sample buffers.

          audioBuffer.getChannelData(0)[0] = 1;
          audioBuffer.getChannelData(0)[1] = 1;
          audioBuffer.getChannelData(1)[0] = 1;
          audioBuffer.getChannelData(1)[1] = 1;
          audioBufferSourceNode.buffer = audioBuffer;
          audioBufferSourceNode.loop = true;

          scriptProcessorNode.onaudioprocess = function (event) {
            var channelData = event.inputBuffer.getChannelData(1);
            var length = channelData.length;

            for (var i = 0; i < length; i += 1) {
              if (channelData[i] !== 0) {
                resolve(false);
                return;
              }
            }

            if (startTime + 1 / audioContext.sampleRate < event.playbackTime) {
              resolve(true);
            }
          };

          audioBufferSourceNode.connect(channelMergerNode, 0, 0);
          channelMergerNode.connect(scriptProcessorNode);
          scriptProcessorNode.connect(audioContext.destination);
          startTime = audioContext.currentTime;
          audioBufferSourceNode.start(startTime);
        }).then(function (result) {
          audioBufferSourceNode.stop();
          audioBufferSourceNode.disconnect();
          channelMergerNode.disconnect();
          scriptProcessorNode.disconnect();
          audioContext.close();
          return result;
        });
      };
    };

    /**
     * Firefox up to version 61 had a bug which caused the ChannelSplitterNode to expose a wrong channelCount property.
     */
    var createTestChannelSplitterNodeChannelCountSupport = function createTestChannelSplitterNodeChannelCountSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var channelSplitterNode = offlineAudioContext.createChannelSplitter(4);
        return channelSplitterNode.channelCount === 4;
      };
    };

    var createTestConstantSourceNodeAccurateSchedulingSupport = function createTestConstantSourceNodeAccurateSchedulingSupport(createNativeAudioNode) {
      return function (nativeContext) {
        // @todo TypeScript doesn't know yet about createConstantSource().
        var nativeConstantSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createConstantSource();
        });
        /*
         * @todo This is using bug #75 to detect bug #70. That works because both bugs are unique to
         * the implementation of Firefox right now, but it could probably be done in a better way.
         */

        return nativeConstantSourceNode.offset.maxValue !== Number.POSITIVE_INFINITY;
      };
    };

    var createTestIsSecureContextSupport = function createTestIsSecureContextSupport(window) {
      return function () {
        return window !== null && window.hasOwnProperty('isSecureContext');
      };
    };

    var DEFAULT_OPTIONS$g = {
      curve: null,
      oversample: 'none'
    };
    var createWaveShaperNodeConstructor = function createWaveShaperNodeConstructor(createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor) {
      return (
        /*#__PURE__*/
        function (_noneAudioDestination) {
          _inherits(WaveShaperNode, _noneAudioDestination);

          function WaveShaperNode(context) {
            var _this;

            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_OPTIONS$g;

            _classCallCheck(this, WaveShaperNode);

            var nativeContext = getNativeContext(context);
            var mergedOptions = Object.assign({}, DEFAULT_OPTIONS$g, options);
            var nativeWaveShaperNode = createNativeWaveShaperNode(nativeContext, mergedOptions);
            var isOffline = isNativeOfflineAudioContext(nativeContext);
            var waveShaperNodeRenderer = isOffline ? createWaveShaperNodeRenderer() : null;
            _this = _possibleConstructorReturn(this, _getPrototypeOf(WaveShaperNode).call(this, context, nativeWaveShaperNode, waveShaperNodeRenderer));
            _this._isCurveNullified = false;
            _this._nativeWaveShaperNode = nativeWaveShaperNode;
            return _this;
          }

          _createClass(WaveShaperNode, [{
            key: "curve",
            get: function get() {
              if (this._isCurveNullified) {
                return null;
              }

              return this._nativeWaveShaperNode.curve;
            },
            set: function set(value) {
              // Bug #103: Safari does not allow to set the curve to null.
              if (value === null) {
                this._isCurveNullified = true;
                this._nativeWaveShaperNode.curve = new Float32Array([0, 0]); // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
                // Bug #104: Chrome will throw an InvalidAccessError when the curve has less than two samples.
              } else if (value.length < 2) {
                throw createInvalidStateError();
              } else {
                this._isCurveNullified = false;
                this._nativeWaveShaperNode.curve = value;
              }
            }
          }, {
            key: "oversample",
            get: function get() {
              return this._nativeWaveShaperNode.oversample;
            },
            set: function set(value) {
              this._nativeWaveShaperNode.oversample = value;
            }
          }]);

          return WaveShaperNode;
        }(noneAudioDestinationNodeConstructor)
      );
    };

    var createWaveShaperNodeRendererFactory = function createWaveShaperNodeRendererFactory(createNativeWaveShaperNode) {
      return function () {
        var nativeWaveShaperNode = null;
        return {
          render: function () {
            var _render = _asyncToGenerator(
            /*#__PURE__*/
            _regeneratorRuntime.mark(function _callee(proxy, nativeOfflineAudioContext) {
              var options;
              return _regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      if (!(nativeWaveShaperNode !== null)) {
                        _context.next = 2;
                        break;
                      }

                      return _context.abrupt("return", nativeWaveShaperNode);

                    case 2:
                      nativeWaveShaperNode = getNativeAudioNode(proxy);
                      /*
                       * If the initially used nativeWaveShaperNode was not constructed on the same OfflineAudioContext it needs to be created
                       * again.
                       */

                      if (!isOwnedByContext(nativeWaveShaperNode, nativeOfflineAudioContext)) {
                        options = {
                          channelCount: nativeWaveShaperNode.channelCount,
                          channelCountMode: nativeWaveShaperNode.channelCountMode,
                          channelInterpretation: nativeWaveShaperNode.channelInterpretation,
                          curve: nativeWaveShaperNode.curve,
                          oversample: nativeWaveShaperNode.oversample
                        };
                        nativeWaveShaperNode = createNativeWaveShaperNode(nativeOfflineAudioContext, options);
                      }

                      _context.next = 6;
                      return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeWaveShaperNode);

                    case 6:
                      return _context.abrupt("return", nativeWaveShaperNode);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function render(_x, _x2) {
              return _render.apply(this, arguments);
            };
          }()
        };
      };
    };

    var createWindow = function createWindow() {
      return typeof window === 'undefined' ? null : window;
    };

    var createWrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = function createWrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(createNativeAudioNode) {
      return function (nativeAudioScheduledSourceNode, nativeContext) {
        var nativeGainNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createGain();
        });
        nativeAudioScheduledSourceNode.connect(nativeGainNode);

        var disconnectGainNode = function (disconnect) {
          return function () {
            disconnect.call(nativeAudioScheduledSourceNode, nativeGainNode);
            nativeAudioScheduledSourceNode.removeEventListener('ended', disconnectGainNode);
          };
        }(nativeAudioScheduledSourceNode.disconnect);

        nativeAudioScheduledSourceNode.addEventListener('ended', disconnectGainNode);
        interceptConnections(nativeAudioScheduledSourceNode, nativeGainNode);

        nativeAudioScheduledSourceNode.stop = function (stop) {
          var isStopped = false;
          return function () {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            if (isStopped) {
              try {
                stop.call(nativeAudioScheduledSourceNode, when);
              } catch (_a) {
                nativeGainNode.gain.setValueAtTime(0, when);
              }
            } else {
              stop.call(nativeAudioScheduledSourceNode, when);
              isStopped = true;
            }
          };
        }(nativeAudioScheduledSourceNode.stop);
      };
    };

    var createWrapChannelMergerNode = function createWrapChannelMergerNode(createInvalidStateError, createNativeAudioNode) {
      return function (nativeContext, channelMergerNode) {
        var audioBufferSourceNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createBufferSource();
        });
        channelMergerNode.channelCount = 1;
        channelMergerNode.channelCountMode = 'explicit'; // Bug #20: Safari requires a connection of any kind to treat the input signal correctly.

        var length = channelMergerNode.numberOfInputs;

        for (var i = 0; i < length; i += 1) {
          audioBufferSourceNode.connect(channelMergerNode, 0, i);
        }

        Object.defineProperty(channelMergerNode, 'channelCount', {
          get: function get() {
            return 1;
          },
          set: function set() {
            throw createInvalidStateError();
          }
        });
        Object.defineProperty(channelMergerNode, 'channelCountMode', {
          get: function get() {
            return 'explicit';
          },
          set: function set() {
            throw createInvalidStateError();
          }
        });
      };
    };

    var createWrapConstantSourceNodeAccurateScheduling = function createWrapConstantSourceNodeAccurateScheduling(createNativeAudioNode) {
      return function (nativeConstantSourceNode, nativeContext) {
        var nativeGainNode = createNativeAudioNode(nativeContext, function (ntvCntxt) {
          return ntvCntxt.createGain();
        });
        nativeConstantSourceNode.connect(nativeGainNode);

        var disconnectGainNode = function (disconnect) {
          return function () {
            disconnect.call(nativeConstantSourceNode, nativeGainNode);
            nativeConstantSourceNode.removeEventListener('ended', disconnectGainNode);
          };
        }(nativeConstantSourceNode.disconnect);

        nativeConstantSourceNode.addEventListener('ended', disconnectGainNode);
        interceptConnections(nativeConstantSourceNode, nativeGainNode);
        var startTime = 0;
        var stopTime = null;

        var scheduleEnvelope = function scheduleEnvelope() {
          nativeGainNode.gain.cancelScheduledValues(0);
          nativeGainNode.gain.setValueAtTime(0, 0);

          if (stopTime === null || startTime < stopTime) {
            nativeGainNode.gain.setValueAtTime(1, startTime);
          }

          if (stopTime !== null && startTime < stopTime) {
            nativeGainNode.gain.setValueAtTime(0, stopTime);
          }
        };

        nativeConstantSourceNode.start = function (start) {
          return function () {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            start.call(nativeConstantSourceNode, when);
            startTime = when;
            scheduleEnvelope();
          };
        }(nativeConstantSourceNode.start);

        nativeConstantSourceNode.stop = function (stop) {
          return function () {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            stop.call(nativeConstantSourceNode, when);
            stopTime = when;
            scheduleEnvelope();
          };
        }(nativeConstantSourceNode.stop);
      };
    };

    var window$1 = createWindow();
    var nativeOfflineAudioContextConstructor = createNativeOfflineAudioContextConstructor(window$1);
    var isNativeOfflineAudioContext = createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor);
    var nativeAudioContextConstructor = createNativeAudioContextConstructor(window$1);
    var getBackupNativeContext = createGetBackupNativeContext(isNativeOfflineAudioContext, nativeAudioContextConstructor, nativeOfflineAudioContextConstructor);
    var createNativeAudioNode = createNativeAudioNodeFactory(getBackupNativeContext);
    var createNativeAnalyserNode = createNativeAnalyserNodeFactory(createNativeAudioNode);
    var createAnalyserNodeRenderer = createAnalyserNodeRendererFactory(createNativeAnalyserNode);
    var audioNodeConstructor = createAudioNodeConstructor(createInvalidAccessError, isNativeOfflineAudioContext);
    var noneAudioDestinationNodeConstructor = createNoneAudioDestinationNodeConstructor(audioNodeConstructor);
    var analyserNodeConstructor = createAnalyserNodeConstructor(createAnalyserNodeRenderer, createNativeAnalyserNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var nativeAudioBufferConstructor = createNativeAudioBufferConstructor(window$1);
    var audioBufferConstructor = createAudioBufferConstructor(createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor));
    var testAudioScheduledSourceNodeStartMethodNegativeParametersSupport = createTestAudioScheduledSourceNodeStartMethodNegativeParametersSupport(createNativeAudioNode);
    var testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport = createTestAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(createNativeAudioNode);
    var testAudioScheduledSourceNodeStopMethodNegativeParametersSupport = createTestAudioScheduledSourceNodeStopMethodNegativeParametersSupport(createNativeAudioNode);
    var wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = createWrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(createNativeAudioNode);
    var createNativeAudioBufferSourceNode = createNativeAudioBufferSourceNodeFactory(createNativeAudioNode, createTestAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(createNativeAudioNode), createTestAudioBufferSourceNodeStartMethodDurationParameterSupport(nativeOfflineAudioContextConstructor), testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
    var createAudioBufferSourceNodeRenderer = createAudioBufferSourceNodeRendererFactory(createNativeAudioBufferSourceNode);
    var createAudioParam = createAudioParamFactory(createAudioParamRenderer);
    var audioBufferSourceNodeConstructor = createAudioBufferSourceNodeConstructor(createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var audioDestinationNodeConstructor = createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNode, isNativeOfflineAudioContext);
    var createNativeBiquadFilterNode = createNativeBiquadFilterNodeFactory(createNativeAudioNode);
    var createBiquadFilterNodeRenderer = createBiquadFilterNodeRendererFactory(createNativeBiquadFilterNode);
    var biquadFilterNodeConstructor = createBiquadFilterNodeConstructor(createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var wrapChannelMergerNode = createWrapChannelMergerNode(createInvalidStateError, createNativeAudioNode);
    var createNativeChannelMergerNode = createNativeChannelMergerNodeFactory(createNativeAudioNode, wrapChannelMergerNode);
    var createChannelMergerNodeRenderer = createChannelMergerNodeRendererFactory(createNativeChannelMergerNode);
    var channelMergerNodeConstructor = createChannelMergerNodeConstructor(createChannelMergerNodeRenderer, createNativeChannelMergerNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createNativeChannelSplitterNode = createNativeChannelSplitterNodeFactory(createNativeAudioNode);
    var createChannelSplitterNodeRenderer = createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode);
    var channelSplitterNodeConstructor = createChannelSplitterNodeConstructor(createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createNativeGainNode = createNativeGainNodeFactory(createNativeAudioNode);
    var createNativeConstantSourceNodeFaker = createNativeConstantSourceNodeFakerFactory(createNativeAudioBufferSourceNode, createNativeGainNode);
    var testConstantSourceNodeAccurateSchedulingSupport = createTestConstantSourceNodeAccurateSchedulingSupport(createNativeAudioNode);
    var wrapConstantSourceNodeAccurateScheduling = createWrapConstantSourceNodeAccurateScheduling(createNativeAudioNode);
    var createNativeConstantSourceNode = createNativeConstantSourceNodeFactory(createNativeAudioNode, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, testConstantSourceNodeAccurateSchedulingSupport, wrapConstantSourceNodeAccurateScheduling);
    var createConstantSourceNodeRenderer = createConstantSourceNodeRendererFactory(createNativeConstantSourceNode);
    var constantSourceNodeConstructor = createConstantSourceNodeConstructor(createAudioParam, createConstantSourceNodeRenderer, createNativeConstantSourceNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createGainNodeRenderer = createGainNodeRendererFactory(createNativeGainNode);
    var gainNodeConstructor = createGainNodeConstructor(createAudioParam, createGainNodeRenderer, createNativeGainNode, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createNativeScriptProcessorNode = createNativeScriptProcessorNodeFactory(createNativeAudioNode);
    var createNativeIIRFilterNodeFaker = createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError);
    var renderNativeOfflineAudioContext = createRenderNativeOfflineAudioContext(createNativeGainNode);
    var createIIRFilterNodeRenderer = createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, createNativeAudioNode, nativeOfflineAudioContextConstructor, renderNativeOfflineAudioContext);
    var createNativeIIRFilterNode = createNativeIIRFilterNodeFactory(createNativeAudioNode, createNativeIIRFilterNodeFaker);
    var iIRFilterNodeConstructor = createIIRFilterNodeConstructor(createNativeIIRFilterNode, createIIRFilterNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var minimalBaseAudioContextConstructor = createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor);
    var createNativeOscillatorNode = createNativeOscillatorNodeFactory(createNativeAudioNode, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
    var createOscillatorNodeRenderer = createOscillatorNodeRendererFactory(createNativeOscillatorNode);
    var oscillatorNodeConstructor = createOscillatorNodeConstructor(createAudioParam, createInvalidStateError, createNativeOscillatorNode, createOscillatorNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createNativeWaveShaperNode = createNativeWaveShaperNodeFactory(createInvalidStateError, createNativeAudioNode);
    var nativeStereoPannerNodeFakerFactory = createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError);
    var createNativeStereoPannerNode = createNativeStereoPannerNodeFactory(createNativeAudioNode, nativeStereoPannerNodeFakerFactory, createNotSupportedError);
    var createStereoPannerNodeRenderer = createStereoPannerNodeRendererFactory(createNativeStereoPannerNode);
    var stereoPannerNodeConstructor = createStereoPannerNodeConstructor(createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var createWaveShaperNodeRenderer = createWaveShaperNodeRendererFactory(createNativeWaveShaperNode);
    var waveShaperNodeConstructor = createWaveShaperNodeConstructor(createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, isNativeOfflineAudioContext, noneAudioDestinationNodeConstructor);
    var isSecureContext = createIsSecureContext(window$1); // The addAudioWorkletModule() function is only available in a SecureContext.

    var addAudioWorkletModule = isSecureContext ? createAddAudioWorkletModule(createAbortError, createNotSupportedError, createFetchSource(createAbortError), getBackupNativeContext) : undefined;
    var decodeAudioData = createDecodeAudioData(createDataCloneError, createEncodingError, nativeOfflineAudioContextConstructor, isNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsSubarraySupport, testPromiseSupport);
    var baseAudioContextConstructor = createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, decodeAudioData, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor);
    var createNativeMediaElementAudioSourceNode = createNativeMediaElementAudioSourceNodeFactory(createNativeAudioNode);
    var mediaElementAudioSourceNodeConstructor = createMediaElementAudioSourceNodeConstructor(createNativeMediaElementAudioSourceNode, noneAudioDestinationNodeConstructor);
    var createNativeMediaStreamAudioSourceNode = createNativeMediaStreamAudioSourceNodeFactory(createNativeAudioNode);
    var mediaStreamAudioSourceNodeConstructor = createMediaStreamAudioSourceNodeConstructor(createNativeMediaStreamAudioSourceNode, noneAudioDestinationNodeConstructor);
    var audioContextConstructor = createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioSourceNodeConstructor, nativeAudioContextConstructor);
    var connectMultipleOutputs = createConnectMultipleOutputs(createIndexSizeError);
    var disconnectMultipleOutputs = createDisconnectMultipleOutputs(createIndexSizeError);
    var createNativeAudioWorkletNodeFaker = createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs);
    var createNativeAudioWorkletNode = createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioNode, createNativeAudioWorkletNodeFaker, createNotSupportedError);
    var nativeAudioWorkletNodeConstructor = createNativeAudioWorkletNodeConstructor(window$1);
    var createAudioWorkletNodeRenderer = createAudioWorkletNodeRendererFactory(connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, disconnectMultipleOutputs, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderNativeOfflineAudioContext); // The AudioWorkletNode constructor is only available in a SecureContext.

    var audioWorkletNodeConstructor = isSecureContext ? createAudioWorkletNodeConstructor(createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, noneAudioDestinationNodeConstructor) : undefined;
    var minimalAudioContextConstructor = createMinimalAudioContextConstructor(createInvalidStateError, minimalBaseAudioContextConstructor, nativeAudioContextConstructor);
    var startRendering = createStartRendering(renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsSubarraySupport);
    var minimalOfflineAudioContextConstructor = createMinimalOfflineAudioContextConstructor(createInvalidStateError, minimalBaseAudioContextConstructor, nativeOfflineAudioContextConstructor, startRendering);
    var offlineAudioContextConstructor = createOfflineAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, nativeOfflineAudioContextConstructor, startRendering);
    var isSupported = function isSupported() {
      return createIsSupportedPromise(browsernizr, asyncArrayBuffer.isSupported, createTestAudioContextCloseMethodSupport(nativeAudioContextConstructor), createTestAudioContextDecodeAudioDataMethodTypeErrorSupport(nativeOfflineAudioContextConstructor), createTestAudioContextOptionsSupport(nativeAudioContextConstructor), createTestChannelMergerNodeSupport(nativeAudioContextConstructor), createTestChannelSplitterNodeChannelCountSupport(nativeOfflineAudioContextConstructor), createTestIsSecureContextSupport(window$1));
    };

    exports.AnalyserNode = analyserNodeConstructor;
    exports.AudioBuffer = audioBufferConstructor;
    exports.AudioBufferSourceNode = audioBufferSourceNodeConstructor;
    exports.addAudioWorkletModule = addAudioWorkletModule;
    exports.decodeAudioData = decodeAudioData;
    exports.AudioContext = audioContextConstructor;
    exports.AudioWorkletNode = audioWorkletNodeConstructor;
    exports.BiquadFilterNode = biquadFilterNodeConstructor;
    exports.ChannelMergerNode = channelMergerNodeConstructor;
    exports.ChannelSplitterNode = channelSplitterNodeConstructor;
    exports.ConstantSourceNode = constantSourceNodeConstructor;
    exports.GainNode = gainNodeConstructor;
    exports.IIRFilterNode = iIRFilterNodeConstructor;
    exports.MediaElementAudioSourceNode = mediaElementAudioSourceNodeConstructor;
    exports.MediaStreamAudioSourceNode = mediaStreamAudioSourceNodeConstructor;
    exports.MinimalAudioContext = minimalAudioContextConstructor;
    exports.MinimalOfflineAudioContext = minimalOfflineAudioContextConstructor;
    exports.OfflineAudioContext = offlineAudioContextConstructor;
    exports.OscillatorNode = oscillatorNodeConstructor;
    exports.StereoPannerNode = stereoPannerNodeConstructor;
    exports.WaveShaperNode = waveShaperNodeConstructor;
    exports.isSupported = isSupported;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"@babel/runtime/helpers/assertThisInitialized":21,"@babel/runtime/helpers/asyncToGenerator":22,"@babel/runtime/helpers/classCallCheck":23,"@babel/runtime/helpers/createClass":24,"@babel/runtime/helpers/defineProperty":25,"@babel/runtime/helpers/getPrototypeOf":26,"@babel/runtime/helpers/inherits":27,"@babel/runtime/helpers/possibleConstructorReturn":32,"@babel/runtime/helpers/slicedToArray":34,"@babel/runtime/helpers/toConsumableArray":35,"@babel/runtime/helpers/typeof":36,"@babel/runtime/regenerator":37,"async-array-buffer":41,"tslib":47}],47:[function(require,module,exports){
(function (global){
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    __extends = function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
                t[p[i]] = s[p[i]];
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function (m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    };

    __values = function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result["default"] = mod;
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(require,module,exports){
const Utility = {
  rndf( min=0, max=1, number, canRepeat=true ) {
    let out = 0
  	if( number === undefined ) {
  		let diff = max - min,
  		    r = Math.random(),
  		    rr = diff * r

  		out =  min + rr;
  	}else{
      let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
        if( canRepeat ) {
          num = Utility.rndf(min, max)
        }else{
          num = Utility.rndf( min, max )
          while( tmp.indexOf( num ) > -1) {
            num = Utility.rndf( min, max )
          }
          tmp.push( num )
        }
  			output.push( num )
  		}

  		out = output
  	}

    return out
  },

  Rndf( _min = 0, _max = 1, quantity, canRepeat=true ) {
    // have to code gen function to hard code min / max values inside, as closures
    // or bound values won't be passed through the worklet port.XXX perhaps there should
    // be a way to transfer a function and its upvalues through the worklet? OTOH,
    // codegen works fine.

    const fncString = `const min = ${_min}
    const max = ${_max} 
    const range = max - min
    const canRepeat = ${quantity} > range ? true : ${ canRepeat }

    let out

    if( ${quantity} > 1 ) { 
      out = []
      for( let i = 0; i < ${quantity}; i++ ) {
        let num = min + Math.random() * range

        if( canRepeat === false ) {
          while( out.indexOf( num ) > -1 ) {
            num = min + Math.random() * range
          }
        }
        out[ i ] = num
      }
    }else{
      out = min + Math.random() * range 
    }

    return out;`
    
    return new Function( fncString )
  },

  rndi( min = 0, max = 1, number, canRepeat = true ) {
    let range = max - min,
        out
    
    if( range < number ) canRepeat = true

    if( typeof number === 'undefined' ) {
      range = max - min
      out = Math.round( min + Math.random() * range )
    }else{
  		let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
  			if( canRepeat ) {
  				num = Utility.rndi( min, max )
  			}else{
  				num = Utility.rndi( min, max )
  				while( tmp.indexOf( num ) > -1 ) {
  					num = Utility.rndi( min, max )
  				}
  				tmp.push( num )
  			}
  			output.push( num )
  		}
  		out = output
    }
    return out
  },

  Rndi( _min = 0, _max = 1, quantity=1, canRepeat = false ) {
    // have to code gen function to hard code min / max values inside, as closures
    // or bound values won't be passed through the worklet port.XXX perhaps there should
    // be a way to transfer a function and its upvalues through the worklet? OTOH,
    // codegen works fine.

    const fncString = `const min = ${_min}
    const max = ${_max} 
    const range = max - min
    const canRepeat = ${quantity} > range ? true : ${ canRepeat }

    let out

    if( ${quantity} > 1 ) { 
      out = []
      for( let i = 0; i < ${quantity}; i++ ) {
        let num = min + Math.round( Math.random() * range );

        if( canRepeat === false ) {
          while( out.indexOf( num ) > -1 ) {
            num = min + Math.round( Math.random() * range );
          }
        }
        out[ i ] = num
      }
    }else{
      out = min + Math.round( Math.random() * range ); 
    }

    return out;`
    
    return new Function( fncString )
  },

  btof( beats ) { return 1 / (beats * ( 60 / Gibber.Clock.bpm )) },

  random() {
    this.randomFlag = true
    this.randomArgs = Array.prototype.slice.call( arguments, 0 )

    return this
  },

  elementArray: function( list ) {
    let out = []

    for( var i = 0; i < list.length; i++ ) {
      out.push( list.item( i ) )
    }

    return out
  },
  
  __classListMethods: [ 'toggle', 'add', 'remove' ],

  create( query ) {
    let elementList = document.querySelectorAll( query ),
        arr = Utility.elementArray( elementList )
    
    for( let method of Utility.__classListMethods ) { 
      arr[ method ] = style => {
        for( let element of arr ) { 
          element.classList[ method ]( style )
        }
      } 
    }

    return arr
  },

  export( obj ) {
    obj.rndi = this.rndi
    obj.rndf = this.rndf
    obj.Rndi = this.Rndi
    obj.Rndf = this.Rndf
    obj.btof = this.btof

    Array.prototype.rnd = this.random
  }
}

module.exports = Utility

},{}]},{},[18]);
