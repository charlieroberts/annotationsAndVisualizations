const window = {}; 
        let Gibberish = null; 
        let initialized = false;
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Gibberish = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let ugen = require( '../ugen.js' )

let analyzer = Object.create( ugen )

Object.assign( analyzer, {
  __type__: 'analyzer',
  priority:0
})

module.exports = analyzer

},{"../ugen.js":62}],2:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const analyzers = {
    SSD:    require( './singlesampledelay.js'  )( Gibberish ),
    Follow: require( './follow.js'  )( Gibberish )
  }

  analyzers.export = target => {
    for( let key in analyzers ) {
      if( key !== 'export' ) {
        target[ key ] = analyzers[ key ]
      }
    }
  }

return analyzers

}

},{"./follow.js":3,"./singlesampledelay.js":4}],3:[function(require,module,exports){
const g = require('genish.js'),
      analyzer = require('./analyzer.js'),
      ugen = require('../ugen.js');

const genish = g;

module.exports = function (Gibberish) {

  const Follow = inputProps => {

    // main follow object is also the output
    const follow = Object.create(analyzer);
    follow.in = Object.create(ugen);
    follow.id = Gibberish.factory.getUID();

    const props = Object.assign({}, inputProps, Follow.defaults);
    let isStereo = props.input.isStereo !== undefined ? props.input.isStereo : true;

    // the input to the follow ugen is buffered in this ugen
    follow.buffer = g.data(props.bufferSize, 1);

    let avg; // output; make available outside jsdsp block
    const _input = g.in('input');
    const input = isStereo ? g.add(_input[0], _input[1]) : _input;

    {
      "use jsdsp";
      // phase to write to follow buffer
      const bufferPhaseOut = g.accum(1, 0, { max: props.bufferSize, min: 0 });

      // hold running sum
      const sum = g.data(1, 1, { meta: true });

      sum[0] = genish.sub(genish.add(sum[0], input), g.peek(follow.buffer, bufferPhaseOut, { mode: 'simple' }));

      avg = genish.div(sum[0], props.bufferSize);
    }

    if (!isStereo) {
      Gibberish.factory(follow, avg, 'follow_out', props);

      follow.callback.ugenName = follow.ugenName = `follow_out_${ follow.id }`;

      // have to write custom callback for input to reuse components from output,
      // specifically the memory from our buffer
      let idx = follow.buffer.memory.values.idx;
      let phase = 0;
      let abs = Math.abs;
      let callback = function (input, memory) {
        'use strict';

        memory[idx + phase] = abs(input);
        phase++;
        if (phase > props.bufferSize - 1) {
          phase = 0;
        }

        return 0;
      };

      Gibberish.factory(follow.in, input, 'follow_in', props, callback);

      // lots of nonsense to make our custom function work
      follow.in.callback.ugenName = follow.in.ugenName = `follow_in_${ follow.id }`;
      follow.in.inputNames = ['input'];
      follow.in.inputs = [input];
      follow.in.input = props.input;
      follow.in.type = 'analysis';

      if (Gibberish.analyzers.indexOf(follow.in) === -1) {
        Gibberish.analyzers.push(follow.in);
      }

      Gibberish.dirty(Gibberish.analyzers);
    }

    return follow;
  };

  Follow.defaults = {
    bufferSize: 8192
  };

  return Follow;
};
},{"../ugen.js":62,"./analyzer.js":1,"genish.js":103}],4:[function(require,module,exports){
const g = require( 'genish.js' ),
      analyzer = require( './analyzer.js' ),
      proxy    = require( '../workletProxy.js' ),
      ugen     = require( '../ugen.js' )

module.exports = function( Gibberish ) {
 
const Delay = inputProps => {
  let ssd = Object.create( analyzer )
  ssd.__in  = Object.create( ugen )
  ssd.__out = Object.create( ugen )

  ssd.id = Gibberish.factory.getUID()

  let props = Object.assign({}, Delay.defaults, inputProps )
  let isStereo = props.isStereo 
  
  let input = g.in( 'input' )
    
  let historyL = g.history()

  if( isStereo ) {
    // right channel
    let historyR = g.history()

    Gibberish.factory( 
      ssd.__out,
      [ historyL.out, historyR.out ], 
      'ssd_out', 
      props,
      null,
      false
    )

    ssd.__out.callback.ugenName = ssd.__out.ugenName = 'ssd_out' + ssd.id

    const idxL = ssd.__out.graph.memory.value.idx, 
          idxR = idxL + 1,
          memory = Gibberish.genish.gen.memory.heap

    const callback = function( input ) {
      'use strict'
      memory[ idxL ] = input[0]
      memory[ idxR ] = input[1]
      return 0     
    }
    
    Gibberish.factory( ssd.in, [ input[0],input[1] ], 'ssd_in', props, callback, false )

    callback.ugenName = ssd.in.ugenName = 'ssd_in_' + ssd.id
    ssd.in.inputNames = [ 'input' ]
    ssd.in.inputs = [ props.input ]
    ssd.in.input = props.input
    ssd.type = 'analysis'

    ssd.in.listen = function( ugen ) {
      if( ugen !== undefined ) {
        ssd.in.input = ugen
        ssd.in.inputs = [ ugen ]
      }

      if( Gibberish.analyzers.indexOf( ssd.in ) === -1 ) {
        Gibberish.analyzers.push( ssd.in )
      }

      Gibberish.dirty( Gibberish.analyzers )
    }
  }else{
    Gibberish.factory( ssd.__out, historyL.out, 'ssd_out', props, null, false )

    ssd.__out.callback.ugenName = ssd.__out.ugenName = 'ssd_out' + ssd.id

    let idx = ssd.__out.graph.memory.value.idx 
    let memory = Gibberish.genish.gen.memory.heap
    let callback = function( input ) {
      'use strict'
      memory[ idx ] = input
      return 0     
    }
    
    Gibberish.factory( ssd.__in, input, 'ssd_in', {}, callback, false )

    callback.ugenName = ssd.__in.ugenName = 'ssd_in_' + ssd.id
    ssd.__in.inputNames = [ 'input' ]
    ssd.__in.inputs = [ props.input ]
    ssd.__in.input = props.input
    ssd.type = 'analysis'

    ssd.__in.listen = function( ugen ) {
      //console.log( 'listening:', ugen, Gibberish.mode )
      if( ugen !== undefined ) {
        ssd.__in.input = ugen
        ssd.__in.inputs = [ ugen ]
      }

      if( Gibberish.analyzers.indexOf( ssd.__in ) === -1 ) {
        if( Gibberish.mode === 'worklet' ) {
          Gibberish.analyzers.push( { id:ssd.id, prop:'in' })
        }else{
          Gibberish.analyzers.push( ssd.__in )
        }
      }

      Gibberish.dirty( Gibberish.analyzers )
      //console.log( 'in:', ssd.__in )
    }

  }

  ssd.listen = ssd.__in.listen
  ssd.__in.type = 'analysis'

 
  ssd.__out.inputs = []

  const out =  proxy( ['analysis','SSD'], props, ssd )
  
  Object.defineProperties( out, {
    'out': {
      set(v) {},
      get() {
        if( Gibberish.mode === 'worklet' ) {
          return { id:out.id, prop:'out' }
        }else{
          return out.__out
        }
      }
    },
    //'in': {
    //  set(v) {},
    //  get() {
    //    if( Gibberish.mode === 'worklet' ) {
    //      console.log( 'returning ssd in' )
    //      return { id:out.id, prop:'in' }
    //    }else{
    //      return out.__in
    //    }
    //  }
    //},

  })

  return out
}

Delay.defaults = {
  input:0,
  isStereo:false
}

return Delay

}

},{"../ugen.js":62,"../workletProxy.js":65,"./analyzer.js":1,"genish.js":103}],5:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const AD = function( argumentProps ) {
    const ad = Object.create( ugen ),
          attack  = g.in( 'attack' ),
          decay   = g.in( 'decay' )

    const props = Object.assign( {}, AD.defaults, argumentProps )

    const graph = g.ad( attack, decay, { shape:props.shape, alpha:props.alpha })

    ad.trigger = graph.trigger
    
    const __out = Gibberish.factory( ad, graph, ['envelopes','AD'], props )

    return __out
  }

  AD.defaults = { attack:44100, decay:44100, shape:'exponential', alpha:5 } 

  return AD

}

},{"../ugen.js":62,"genish.js":103}],6:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const ADSR = function( argumentProps ) {
    const adsr  = Object.create( ugen ),
          attack  = g.in( 'attack' ),
          decay   = g.in( 'decay' ),
          sustain = g.in( 'sustain' ),
          release = g.in( 'release' ),
          sustainLevel = g.in( 'sustainLevel' )

    const props = Object.assign( {}, ADSR.defaults, argumentProps )

    Object.assign( adsr, props )

    const graph = g.adsr( 
      attack, decay, sustain, sustainLevel, release, 
      { triggerRelease: props.triggerRelease, shape:props.shape, alpha:props.alpha } 
    )

    adsr.trigger = graph.trigger
    adsr.advance = graph.release

    const __out = Gibberish.factory( adsr, graph, ['envelopes','ADSR'], props )

    return __out 
  }

  ADSR.defaults = { 
    attack:22050, 
    decay:22050, 
    sustain:44100, 
    sustainLevel:.6, 
    release: 44100, 
    triggerRelease:false,
    shape:'exponential',
    alpha:5 
  } 

  return ADSR
}

},{"../ugen.js":62,"genish.js":103}],7:[function(require,module,exports){
const g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const Envelopes = {
    AD     : require( './ad.js' )( Gibberish ),
    ADSR   : require( './adsr.js' )( Gibberish ),
    Ramp   : require( './ramp.js' )( Gibberish ),

    export : target => {
      for( let key in Envelopes ) {
        if( key !== 'export' && key !== 'factory' ) {
          target[ key ] = Envelopes[ key ]
        }
      }
    },

    factory( useADSR, shape, attack, decay, sustain, sustainLevel, release, triggerRelease=false ) {
      let env

      // deliberate use of single = to accomodate both 1 and true
      if( useADSR != true ) {
        env = g.ad( attack, decay, { shape }) 
      }else {
        env = g.adsr( attack, decay, sustain, sustainLevel, release, { shape, triggerRelease })
      }

      return env
    }
  } 

  return Envelopes
}

},{"./ad.js":5,"./adsr.js":6,"./ramp.js":8,"genish.js":103}],8:[function(require,module,exports){
const ugen = require( '../ugen.js' ),
      g = require( 'genish.js' )

module.exports = function( Gibberish ) {

  const Ramp = function( argumentProps ) {
    const ramp   = Object.create( ugen ),
          length = g.in( 'length' ),
          from   = g.in( 'from' ),
          to     = g.in( 'to' )

    const props = Object.assign({}, Ramp.defaults, argumentProps )

    const reset = g.bang()

    const phase = g.accum( g.div( 1, length ), reset, { shouldWrap:props.shouldLoop, shouldClamp:true }),
          diff = g.sub( to, from ),
          graph = g.add( from, g.mul( phase, diff ) )
        
    ramp.trigger = reset.trigger

    const out = Gibberish.factory( ramp, graph, ['envelopes','ramp'], props )


    return out
  }

  Ramp.defaults = { from:0, to:1, length:g.gen.samplerate, shouldLoop:false }

  return Ramp

}

},{"../ugen.js":62,"genish.js":103}],9:[function(require,module,exports){
/*
 * https://github.com/antimatter15/heapqueue.js/blob/master/heapqueue.js
 *
 * This implementation is very loosely based off js-priority-queue
 * by Adam Hooper from https://github.com/adamhooper/js-priority-queue
 *
 * The js-priority-queue implementation seemed a teensy bit bloated
 * with its require.js dependency and multiple storage strategies
 * when all but one were strongly discouraged. So here is a kind of
 * condensed version of the functionality with only the features that
 * I particularly needed.
 *
 * Using it is pretty simple, you just create an instance of HeapQueue
 * while optionally specifying a comparator as the argument:
 *
 * var heapq = new HeapQueue();
 *
 * //IF NEGATIVE, RETURN A
 *
 * var customq = new HeapQueue(function(a, b){
 *   // if b > a, return negative
 *   // means that it spits out the smallest item first
 *   return a - b;
 * });
 *
 * Note that in this case, the default comparator is identical to
 * the comparator which is used explicitly in the second queue.
 *
 * Once you've initialized the heapqueue, you can plop some new
 * elements into the queue with the push method (vaguely reminiscent
 * of typical javascript arays)
 *
 * heapq.push(42);
 * heapq.push("kitten");
 *
 * The push method returns the new number of elements of the queue.
 *
 * You can push anything you'd like onto the queue, so long as your
 * comparator function is capable of handling it. The default
 * comparator is really stupid so it won't be able to handle anything
 * other than an number by default.
 *
 * You can preview the smallest item by using peek.
 *
 * heapq.push(-9999);
 * heapq.peek(); // ==> -9999
 *
 * The useful complement to to the push method is the pop method,
 * which returns the smallest item and then removes it from the
 * queue.
 *
 * heapq.push(1);
 * heapq.push(2);
 * heapq.push(3);
 * heapq.pop(); // ==> 1
 * heapq.pop(); // ==> 2
 * heapq.pop(); // ==> 3
 */
const HeapQueue = function(cmp){
  this.cmp = (cmp || function(a, b){ return a - b; });
  this.length = 0;
  this.data = [];
}
HeapQueue.prototype.peek = function(){
  return this.data[0];
};
HeapQueue.prototype.push = function(value){
  this.data.push(value);

  var pos = this.data.length - 1,
  parent, x;

  while(pos > 0){
    parent = (pos - 1) >>> 1;
    if(this.cmp(this.data[pos], this.data[parent]) < 0){
      x = this.data[parent];
      this.data[parent] = this.data[pos];
      this.data[pos] = x;
      pos = parent;
    }else break;
  }
  return this.length++;
};
HeapQueue.prototype.pop = function(){
  var last_val = this.data.pop(),
  ret = this.data[0];
  if(this.data.length > 0){
    this.data[0] = last_val;
    var pos = 0,
    last = this.data.length - 1,
    left, right, minIndex, x;
    while(1){
      left = (pos << 1) + 1;
      right = left + 1;
      minIndex = pos;
      if(left <= last && this.cmp(this.data[left], this.data[minIndex]) < 0) minIndex = left;
      if(right <= last && this.cmp(this.data[right], this.data[minIndex]) < 0) minIndex = right;
      if(minIndex !== pos){
        x = this.data[minIndex];
        this.data[minIndex] = this.data[pos];
        this.data[pos] = x;
        pos = minIndex;
      }else break;
    }
  } else {
    ret = last_val;
  }
  this.length--;
  return ret;
};

module.exports = HeapQueue

},{}],10:[function(require,module,exports){
let g = require( 'genish.js' )
 
// constructor for schroeder allpass filters
let allPass = function( _input, length=500, feedback=.5 ) {
  let index  = g.counter( 1,0,length ),
      buffer = g.data( length ),
      bufferSample = g.peek( buffer, index, { interp:'none', mode:'samples' }),
      out = g.memo( g.add( g.mul( -1, _input), bufferSample ) )
                
  g.poke( buffer, g.add( _input, g.mul( bufferSample, feedback ) ), index )
 
  return out
}

module.exports = allPass

},{"genish.js":103}],11:[function(require,module,exports){
let g = require( 'genish.js' ),
    filter = require( './filter.js' )

module.exports = function( Gibberish ) {

  Gibberish.genish.biquad = ( input, cutoff, _Q, mode, isStereo ) => {
    let a0,a1,a2,c,b1,b2,
        in1a0,x1a1,x2a2,y1b1,y2b2,
        in1a0_1,x1a1_1,x2a2_1,y1b1_1,y2b2_1

    let returnValue
    
    const Q = g.memo( g.add( .5, g.mul( _Q, 22 ) ) )
    let x1 = g.history(), x2 = g.history(), y1 = g.history(), y2 = g.history()
    
    let w0 = g.memo( g.mul( 2 * Math.PI, g.div( cutoff,  g.gen.samplerate ) ) ),
        sinw0 = g.sin( w0 ),
        cosw0 = g.cos( w0 ),
        alpha = g.memo( g.div( sinw0, g.mul( 2, Q ) ) )

    let oneMinusCosW = g.sub( 1, cosw0 )

    switch( mode ) {
      case 1:
        a0 = g.memo( g.div( g.add( 1, cosw0) , 2) )
        a1 = g.mul( g.add( 1, cosw0 ), -1 )
        a2 = a0
        c  = g.add( 1, alpha )
        b1 = g.mul( -2 , cosw0 )
        b2 = g.sub( 1, alpha )
        break;
      case 2:
        a0 = g.mul( Q, alpha )
        a1 = 0
        a2 = g.mul( a0, -1 )
        c  = g.add( 1, alpha )
        b1 = g.mul( -2 , cosw0 )
        b2 = g.sub( 1, alpha )
        break;
      default: // LP
        a0 = g.memo( g.div( oneMinusCosW, 2) )
        a1 = oneMinusCosW
        a2 = a0
        c  = g.add( 1, alpha )
        b1 = g.mul( -2 , cosw0 )
        b2 = g.sub( 1, alpha )
    }

    a0 = g.div( a0, c ); a1 = g.div( a1, c ); a2 = g.div( a2, c )
    b1 = g.div( b1, c ); b2 = g.div( b2, c )

    in1a0 = g.mul( x1.in( isStereo ? input[0] : input ), a0 )
    x1a1  = g.mul( x2.in( x1.out ), a1 )
    x2a2  = g.mul( x2.out,          a2 )

    let sumLeft = g.add( in1a0, x1a1, x2a2 )

    y1b1 = g.mul( y2.in( y1.out ), b1 )
    y2b2 = g.mul( y2.out, b2 )

    let sumRight = g.add( y1b1, y2b2 )

    let diff = g.sub( sumLeft, sumRight )

    y1.in( diff )

    if( isStereo ) {
      let x1_1 = g.history(), x2_1 = g.history(), y1_1 = g.history(), y2_1 = g.history()

      in1a0_1 = g.mul( x1_1.in( input[1] ), a0 )
      x1a1_1  = g.mul( x2_1.in( x1_1.out ), a1 )
      x2a2_1  = g.mul( x2_1.out,            a2 )

      let sumLeft_1 = g.add( in1a0_1, x1a1_1, x2a2_1 )

      y1b1_1 = g.mul( y2_1.in( y1_1.out ), b1 )
      y2b2_1 = g.mul( y2_1.out, b2 )

      let sumRight_1 = g.add( y1b1_1, y2b2_1 )

      let diff_1 = g.sub( sumLeft_1, sumRight_1 )

      y1_1.in( diff_1 )
      
      returnValue = [ diff, diff_1 ]
    }else{
      returnValue = diff
    }

    return returnValue
  }

  let Biquad = inputProps => {
    let biquad = Object.create( filter )
    let props = Object.assign( {}, Biquad.defaults, inputProps ) 
    
    Object.assign( biquad, props )

    let isStereo = biquad.input.isStereo

    biquad.__createGraph = function() {
      biquad.graph = Gibberish.genish.biquad( g.in('input'), g.mul( g.in('cutoff'), g.gen.samplerate / 4 ),  g.in('Q'), biquad.mode, isStereo )
    }

    biquad.__createGraph()
    biquad.__requiresRecompilation = [ 'mode' ]

    const __out = Gibberish.factory(
      biquad,
      biquad.graph,
      ['filters','Filter12Biquad'], 
      props
    )

    return __out
  }

  Biquad.defaults = {
    input:0,
    Q: .15,
    cutoff:.05,
    mode:0
  }

  return Biquad

}


},{"./filter.js":14,"genish.js":103}],12:[function(require,module,exports){
let g = require( 'genish.js' )

let combFilter = function( _input, combLength, damping=.5*.4, feedbackCoeff=.84 ) {
  let lastSample   = g.history(),
  	  readWriteIdx = g.counter( 1,0,combLength ),
      combBuffer   = g.data( combLength ),
	    out          = g.peek( combBuffer, readWriteIdx, { interp:'none', mode:'samples' }),
      storeInput   = g.memo( g.add( g.mul( out, g.sub( 1, damping)), g.mul( lastSample.out, damping ) ) )
      
  lastSample.in( storeInput )
 
  g.poke( combBuffer, g.add( _input, g.mul( storeInput, feedbackCoeff ) ), readWriteIdx )
 
  return out
}

module.exports = combFilter

},{"genish.js":103}],13:[function(require,module,exports){
const g = require( 'genish.js' ),
      filter = require( './filter.js' )

module.exports = function( Gibberish ) {
  Gibberish.genish.diodeZDF = ( input, _Q, freq, saturation, isStereo=false ) => {
    const iT = 1 / g.gen.samplerate,
          kz1 = g.history(0),
          kz2 = g.history(0),
          kz3 = g.history(0),
          kz4 = g.history(0)

    let   ka1 = 1.0,
          ka2 = 0.5,
          ka3 = 0.5,
          ka4 = 0.5,
          kindx = 0   

    // XXX this is where the magic number hapens for Q...
    const Q = g.memo( g.add( .5, g.mul( _Q, g.add( 5, g.sub( 5, g.mul( g.div( freq, 20000  ), 5 ) ) ) ) ) )
    // kwd = 2 * $M_PI * acf[kindx]
    const kwd = g.memo( g.mul( Math.PI * 2, freq ) )

    // kwa = (2/iT) * tan(kwd * iT/2) 
    const kwa =g.memo( g.mul( 2/iT, g.tan( g.mul( kwd, iT/2 ) ) ) )

    // kG  = kwa * iT/2 
    const kg = g.memo( g.mul( kwa, iT/2 ) )
    
    const kG4 = g.memo( g.mul( .5, g.div( kg, g.add( 1, kg ) ) ) )
    const kG3 = g.memo( g.mul( .5, g.div( kg, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG4 ) ) ) ) )
    const kG2 = g.memo( g.mul( .5, g.div( kg, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG3 ) ) ) ) )
    const kG1 = g.memo( g.div( kg, g.sub( g.add( 1, kg ), g.mul( kg, kG2 ) ) ) )

    const kGAMMA = g.memo( g.mul( g.mul( kG4, kG3 ) , g.mul( kG2, kG1 ) ) )

    const kSG1 = g.memo( g.mul( g.mul( kG4, kG3 ), kG2 ) ) 

    const kSG2 = g.memo( g.mul( kG4, kG3) )  
    const kSG3 = kG4 
    let kSG4 = 1.0 
    // kk = 4.0*(kQ - 0.5)/(25.0 - 0.5)
    const kalpha = g.memo( g.div( kg, g.add(1.0, kg) ) )

    const kbeta1 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( kg, kG2 ) ) ) )
    const kbeta2 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG3 ) ) ) )
    const kbeta3 = g.memo( g.div( 1.0, g.sub( g.add( 1, kg ), g.mul( g.mul( .5, kg ), kG4 ) ) ) )
    const kbeta4 = g.memo( g.div( 1.0, g.add( 1, kg ) ) ) 

    const kgamma1 = g.memo( g.add( 1, g.mul( kG1, kG2 ) ) )
    const kgamma2 = g.memo( g.add( 1, g.mul( kG2, kG3 ) ) )
    const kgamma3 = g.memo( g.add( 1, g.mul( kG3, kG4 ) ) )

    const kdelta1 = kg
    const kdelta2 = g.memo( g.mul( 0.5, kg ) )
    const kdelta3 = g.memo( g.mul( 0.5, kg ) )

    const kepsilon1 = kG2
    const kepsilon2 = kG3
    const kepsilon3 = kG4

    const klastcut = freq

    //;; feedback inputs 
    const kfb4 = g.memo( g.mul( kbeta4 , kz4.out ) ) 
    const kfb3 = g.memo( g.mul( kbeta3, g.add( kz3.out, g.mul( kfb4, kdelta3 ) ) ) )
    const kfb2 = g.memo( g.mul( kbeta2, g.add( kz2.out, g.mul( kfb3, kdelta2 ) ) ) )

    //;; feedback process

    const kfbo1 = g.memo( g.mul( kbeta1, g.add( kz1.out, g.mul( kfb2, kdelta1 ) ) ) ) 
    const kfbo2 = g.memo( g.mul( kbeta2, g.add( kz2.out, g.mul( kfb3, kdelta2 ) ) ) ) 
    const kfbo3 = g.memo( g.mul( kbeta3, g.add( kz3.out, g.mul( kfb4, kdelta3 ) ) ) ) 
    const kfbo4 = kfb4

    const kSIGMA = g.memo( 
      g.add( 
        g.add( 
          g.mul( kSG1, kfbo1 ), 
          g.mul( kSG2, kfbo2 )
        ), 
        g.add(
          g.mul( kSG3, kfbo3 ), 
          g.mul( kSG4, kfbo4 )
        ) 
      ) 
    )

    //const kSIGMA = 1
    //;; non-linear processing
    //if (knlp == 1) then
    //  kin = (1.0 / tanh(ksaturation)) * tanh(ksaturation * kin)
    //elseif (knlp == 2) then
    //  kin = tanh(ksaturation * kin) 
    //endif
    //
    //const kin = input 
    let kin = input//g.memo( g.mul( g.div( 1, g.tanh( saturation ) ), g.tanh( g.mul( saturation, input ) ) ) )
    kin = g.tanh( g.mul( saturation, kin ) )

    const kun = g.div( g.sub( kin, g.mul( Q, kSIGMA ) ), g.add( 1, g.mul( Q, kGAMMA ) ) )
    //const kun = g.div( 1, g.add( 1, g.mul( Q, kGAMMA ) ) )
        //(kin - kk * kSIGMA) / (1.0 + kk * kGAMMA)

    //;; 1st stage
    let kxin = g.memo( g.add( g.add( g.mul( kun, kgamma1 ), kfb2), g.mul( kepsilon1, kfbo1 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    let kv = g.memo( g.mul( g.sub( g.mul( ka1, kxin ), kz1.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    let klp = g.add( kv, kz1.out )
    //klp = kv + kz1
    kz1.in( g.add( klp, kv ) ) 
    //kz1 = klp + kv

        //;; 2nd stage
    //kxin = (klp * kgamma2 + kfb3 + kepsilon2 * kfbo2)
    //kv = (ka2 * kxin - kz2) * kalpha 
    //klp = kv + kz2
    //kz2 = klp + kv

    kxin = g.memo( g.add( g.add( g.mul( klp, kgamma2 ), kfb3), g.mul( kepsilon2, kfbo2 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka2, kxin ), kz2.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz2.out ) 
    //klp = kv + kz1
    kz2.in( g.add( klp, kv ) ) 
    //kz1 = klp + kv

    //;; 3rd stage
    //kxin = (klp * kgamma3 + kfb4 + kepsilon3 * kfbo3)
    //kv = (ka3 * kxin - kz3) * kalpha 
    //klp = kv + kz3
    //kz3 = klp + kv

    kxin = g.memo( g.add( g.add( g.mul( klp, kgamma3 ), kfb4), g.mul( kepsilon3, kfbo3 ) ) )
    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka3, kxin ), kz3.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz3.out )
    //klp = kv + kz1
    kz3.in( g.add( klp, kv ) )
    //kz1 = klp + kv

    //;; 4th stage
    //kv = (ka4 * klp - kz4) * kalpha 
    //klp = kv + kz4
    //kz4 = klp + kv

    // (kun * kgamma1 + kfb2 + kepsilon1 * kfbo1)
    kv = g.memo( g.mul( g.sub( g.mul( ka4, kxin ), kz4.out ), kalpha ) )
    //kv = (ka1 * kxin - kz1) * kalpha 
    klp = g.add( kv, kz4.out )
    //klp = kv + kz1
    kz4.in( g.add( klp, kv ) )

    //kz1 = klp + kv
    if( isStereo ) {
      //let polesR = g.data([ 0,0,0,0 ], 1, { meta:true }),
      //    rezzR = g.clamp( g.mul( polesR[3], rez ) ),
      //    outputR = g.sub( input[1], rezzR )         

      //polesR[0] = g.add( polesR[0], g.mul( g.add( g.mul(-1, polesR[0] ), outputR   ), cutoff ))
      //polesR[1] = g.add( polesR[1], g.mul( g.add( g.mul(-1, polesR[1] ), polesR[0] ), cutoff ))
      //polesR[2] = g.add( polesR[2], g.mul( g.add( g.mul(-1, polesR[2] ), polesR[1] ), cutoff ))
      //polesR[3] = g.add( polesR[3], g.mul( g.add( g.mul(-1, polesR[3] ), polesR[2] ), cutoff ))

      //let right = g.switch( isLowPass, polesR[3], g.sub( outputR, polesR[3] ) )

      //returnValue = [left, right]
    }else{
     // returnValue = klp
    }
    //returnValue = klp
    
    return klp//returnValue// klp//returnValue
 }

  const DiodeZDF = inputProps => {
    const zdf      = Object.create( filter )
    const props    = Object.assign( {}, DiodeZDF.defaults, filter.defaults, inputProps )
    const isStereo = props.input.isStereo 

    Object.assign( zdf, props )

    const __out = Gibberish.factory(
      zdf, 
      Gibberish.genish.diodeZDF( g.in('input'), g.in('Q'), g.in('cutoff'), g.in('saturation'), isStereo ), 
      ['filters','Filter24TB303'],
      props
    )

    return __out 
  }

  DiodeZDF.defaults = {
    input:0,
    Q: .65,
    saturation: 1,
    cutoff:.5 
  }

  return DiodeZDF

}

},{"./filter.js":14,"genish.js":103}],14:[function(require,module,exports){
let ugen = require( '../ugen.js' )

let filter = Object.create( ugen )

Object.assign( filter, {
  defaults: { bypass:false } 
})

module.exports = filter

},{"../ugen.js":62}],15:[function(require,module,exports){
let g = require( 'genish.js' ),
    filter = require( './filter.js' )

module.exports = function( Gibberish ) {

  Gibberish.genish.filter24 = ( input, _rez, _cutoff, isLowPass, isStereo=false ) => {
    let returnValue,
        polesL = g.data([ 0,0,0,0 ], 1, { meta:true }),
        peekProps = { interp:'none', mode:'simple' },
        rez = g.memo( g.mul( _rez, 5 ) ),
        cutoff = g.memo( g.div( _cutoff, 11025 ) ),
        rezzL = g.clamp( g.mul( polesL[3], rez ) ),
        outputL = g.sub( isStereo ? input[0] : input, rezzL ) 

    polesL[0] = g.add( polesL[0], g.mul( g.add( g.mul(-1, polesL[0] ), outputL   ), cutoff ))
    polesL[1] = g.add( polesL[1], g.mul( g.add( g.mul(-1, polesL[1] ), polesL[0] ), cutoff ))
    polesL[2] = g.add( polesL[2], g.mul( g.add( g.mul(-1, polesL[2] ), polesL[1] ), cutoff ))
    polesL[3] = g.add( polesL[3], g.mul( g.add( g.mul(-1, polesL[3] ), polesL[2] ), cutoff ))
    
    let left = g.switch( isLowPass, polesL[3], g.sub( outputL, polesL[3] ) )

    if( isStereo ) {
      let polesR = g.data([ 0,0,0,0 ], 1, { meta:true }),
          rezzR = g.clamp( g.mul( polesR[3], rez ) ),
          outputR = g.sub( input[1], rezzR )         

      polesR[0] = g.add( polesR[0], g.mul( g.add( g.mul(-1, polesR[0] ), outputR   ), cutoff ))
      polesR[1] = g.add( polesR[1], g.mul( g.add( g.mul(-1, polesR[1] ), polesR[0] ), cutoff ))
      polesR[2] = g.add( polesR[2], g.mul( g.add( g.mul(-1, polesR[2] ), polesR[1] ), cutoff ))
      polesR[3] = g.add( polesR[3], g.mul( g.add( g.mul(-1, polesR[3] ), polesR[2] ), cutoff ))

      let right = g.switch( isLowPass, polesR[3], g.sub( outputR, polesR[3] ) )

      returnValue = [left, right]
    }else{
      returnValue = left
    }

    return returnValue
  }

  let Filter24 = inputProps => {
    let filter24   = Object.create( filter )
    let props    = Object.assign( {}, Filter24.defaults, filter.defaults, inputProps )
    let isStereo = props.input.isStereo 

    const __out = Gibberish.factory(
      filter24, 
      Gibberish.genish.filter24( g.in('input'), g.in('Q'), g.in('cutoff'), g.in('isLowPass'), isStereo ), 
      ['filters','Filter24Classic'],
      props
    )

    return __out
  }


  Filter24.defaults = {
    input:0,
    Q: .25,
    cutoff: 880,
    isLowPass:1
  }

  return Filter24

}


},{"./filter.js":14,"genish.js":103}],16:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const g = Gibberish.genish

  const filters = {
    Filter24Classic : require( './filter24.js'  )( Gibberish ),
    Filter24Moog    : require( './ladderFilterZeroDelay.js' )( Gibberish ),
    Filter24TB303   : require( './diodeFilterZDF.js' )( Gibberish ),
    Filter12Biquad  : require( './biquad.js'    )( Gibberish ),
    Filter12SVF     : require( './svf.js'       )( Gibberish ),
    
    // not for use by end-users
    genish: {
      Comb        : require( './combfilter.js' ),
      AllPass     : require( './allpass.js' )
    },

    factory( input, cutoff, resonance, saturation = null, _props, isStereo = false ) {
      let filteredOsc 

      //if( props.filterType === 1 ) {
      //  if( typeof props.cutoff !== 'object' && props.cutoff > 1 ) {
      //    props.cutoff = .25
      //  }
      //  if( typeof props.cutoff !== 'object' && props.filterMult > .5 ) {
      //    props.filterMult = .1
      //  }
      //}
      let props = Object.assign({}, filters.defaults, _props )

      switch( props.filterType ) {
        case 1:
          filteredOsc = g.zd24( input, g.min( g.in('Q'), .9999 ),  g.min( cutoff, 20000 ) )
          break;
        case 2:
          filteredOsc = g.diodeZDF( input, g.min( g.in('Q'), .9999 ), g.min( cutoff, 20000 ), g.in('saturation'), isStereo ) 
          break;
        case 3:
          filteredOsc = g.svf( input, cutoff, g.sub( 1, g.in('Q')), props.filterMode, isStereo ) 
          break; 
        case 4:
          filteredOsc = g.biquad( input, cutoff,  g.in('Q'), props.filterMode, isStereo ) 
          break; 
        case 5:
          //isLowPass = g.param( 'lowPass', 1 ),
          filteredOsc = g.filter24( input, g.in('Q'), cutoff, props.filterMode, isStereo )
          break;
        default:
          // return unfiltered signal
          filteredOsc = input //g.filter24( oscWithGain, g.in('resonance'), cutoff, isLowPass )
          break;
      }

      return filteredOsc
    },

    defaults: { filterMode: 0, filterType:0 }
  }

  filters.export = target => {
    for( let key in filters ) {
      if( key !== 'export' && key !== 'genish' ) {
        target[ key ] = filters[ key ]
      }
    }
  }

return filters

}

},{"./allpass.js":10,"./biquad.js":11,"./combfilter.js":12,"./diodeFilterZDF.js":13,"./filter24.js":15,"./ladderFilterZeroDelay.js":17,"./svf.js":18}],17:[function(require,module,exports){
const g = require( 'genish.js' ),
      filterProto = require( './filter.js' )

module.exports = function( Gibberish ) {

  Gibberish.genish.zd24 = ( input, _Q, freq, isStereo=false ) => {
    const iT = 1 / g.gen.samplerate,
          z1 = g.history(0),
          z2 = g.history(0),
          z3 = g.history(0),
          z4 = g.history(0)
    
    const Q = g.memo( g.add( .5, g.mul( _Q, 23 ) ) )
    // kwd = 2 * $M_PI * acf[kindx]
    const kwd = g.memo( g.mul( Math.PI * 2, freq ) )

    // kwa = (2/iT) * tan(kwd * iT/2) 
    const kwa =g.memo( g.mul( 2/iT, g.tan( g.mul( kwd, iT/2 ) ) ) )

    // kG  = kwa * iT/2 
    const kg = g.memo( g.mul( kwa, iT/2 ) )

    // kk = 4.0*(kQ - 0.5)/(25.0 - 0.5)
    const kk = g.memo( g.mul( 4, g.div( g.sub( Q, .5 ), 24.5 ) ) )

    // kg_plus_1 = (1.0 + kg)
    const kg_plus_1 = g.add( 1, kg )

    // kG = kg / kg_plus_1 
    const kG     = g.memo( g.div( kg, kg_plus_1 ) ),
          kG_2   = g.memo( g.mul( kG, kG ) ),
          kG_3   = g.mul( kG_2, kG ),
          kGAMMA = g.mul( kG_2, kG_2 )

    const kS1 = g.div( z1.out, kg_plus_1 ),
          kS2 = g.div( z2.out, kg_plus_1 ),
          kS3 = g.div( z3.out, kg_plus_1 ),
          kS4 = g.div( z4.out, kg_plus_1 )

    //kS = kG_3 * kS1  + kG_2 * kS2 + kG * kS3 + kS4 
    const kS = g.memo( 
      g.add(
        g.add( g.mul(kG_3, kS1), g.mul( kG_2, kS2) ),
        g.add( g.mul(kG, kS3), kS4 )
      )
    )

    //ku = (kin - kk *  kS) / (1 + kk * kGAMMA)
    const ku1 = g.sub( input, g.mul( kk, kS ) )
    const ku2 = g.memo( g.add( 1, g.mul( kk, kGAMMA ) ) )
    const ku  = g.memo( g.div( ku1, ku2 ) )

    let kv =  g.memo( g.mul( g.sub( ku, z1.out ), kG ) )
    let klp = g.memo( g.add( kv, z1.out ) )
    z1.in( g.add( klp, kv ) )

    kv  = g.memo( g.mul( g.sub( klp, z2.out ), kG ) )
    klp = g.memo( g.add( kv, z2.out ) )
    z2.in( g.add( klp, kv ) )

    kv  = g.memo( g.mul( g.sub( klp, z3.out ), kG ) )
    klp = g.memo( g.add( kv, z3.out ) )
    z3.in( g.add( klp, kv ) )

    kv  = g.memo( g.mul( g.sub( klp, z4.out ), kG ) )
    klp = g.memo( g.add( kv, z4.out ) )
    z4.in( g.add( klp, kv ) )


    if( isStereo ) {
      //let polesR = g.data([ 0,0,0,0 ], 1, { meta:true }),
      //    rezzR = g.clamp( g.mul( polesR[3], rez ) ),
      //    outputR = g.sub( input[1], rezzR )         

      //polesR[0] = g.add( polesR[0], g.mul( g.add( g.mul(-1, polesR[0] ), outputR   ), cutoff ))
      //polesR[1] = g.add( polesR[1], g.mul( g.add( g.mul(-1, polesR[1] ), polesR[0] ), cutoff ))
      //polesR[2] = g.add( polesR[2], g.mul( g.add( g.mul(-1, polesR[2] ), polesR[1] ), cutoff ))
      //polesR[3] = g.add( polesR[3], g.mul( g.add( g.mul(-1, polesR[3] ), polesR[2] ), cutoff ))

      //let right = g.switch( isLowPass, polesR[3], g.sub( outputR, polesR[3] ) )

      //returnValue = [left, right]
    }//else{
      //returnValue = klp
    //}

    return klp//returnValue
  }

  const Zd24 = inputProps => {
    const filter   = Object.create( filterProto )
    const props    = Object.assign( {}, Zd24.defaults, filter.defaults, inputProps )
    const isStereo = props.input.isStereo 

    const __out = Gibberish.factory(
      filter, 
      Gibberish.genish.zd24( g.in('input'), g.in('Q'), g.in('cutoff'), isStereo ), 
      ['filters','Filter24Moog'],
      props
    )

    return __out
  }


  Zd24.defaults = {
    input:0,
    Q: .75,
    cutoff: 440,
  }

  return Zd24

}


},{"./filter.js":14,"genish.js":103}],18:[function(require,module,exports){
const g = require( 'genish.js' ),
      filter = require( './filter.js' )

module.exports = function( Gibberish ) {
  Gibberish.genish.svf = ( input, cutoff, Q, mode, isStereo ) => {
    let d1 = g.data([0,0], 1, { meta:true }), d2 = g.data([0,0], 1, { meta:true }),
        peekProps = { mode:'simple', interp:'none' }

    let f1 = g.memo( g.mul( 2 * Math.PI, g.div( cutoff, g.gen.samplerate ) ) )
    let oneOverQ = g.memo( g.div( 1, Q ) )
    let l = g.memo( g.add( d2[0], g.mul( f1, d1[0] ) ) ),
        h = g.memo( g.sub( g.sub( isStereo ? input[0] : input, l ), g.mul( Q, d1[0] ) ) ),
        b = g.memo( g.add( g.mul( f1, h ), d1[0] ) ),
        n = g.memo( g.add( h, l ) )

    d1[0] = b
    d2[0] = l

    let out = g.selector( mode, l, h, b, n )

    let returnValue
    if( isStereo ) {
      let d12 = g.data([0,0], 1, { meta:true }), d22 = g.data([0,0], 1, { meta:true })
      let l2 = g.memo( g.add( d22[0], g.mul( f1, d12[0] ) ) ),
          h2 = g.memo( g.sub( g.sub( input[1], l2 ), g.mul( Q, d12[0] ) ) ),
          b2 = g.memo( g.add( g.mul( f1, h2 ), d12[0] ) ),
          n2 = g.memo( g.add( h2, l2 ) )

      d12[0] = b2
      d22[0] = l2

      let out2 = g.selector( mode, l2, h2, b2, n2 )

      returnValue = [ out, out2 ]
    }else{
      returnValue = out
    }

    return returnValue
  }

  let SVF = inputProps => {
    const svf = Object.create( filter )
    const props = Object.assign( {}, SVF.defaults, filter.defaults, inputProps ) 

    const isStereo = props.input.isStereo
    
    // XXX NEEDS REFACTORING
    const __out = Gibberish.factory( 
      svf,
      Gibberish.genish.svf( g.in('input'), g.mul( g.in('cutoff'), g.gen.samplerate / 5 ), g.sub( 1, g.in('Q') ), g.in('mode'), isStereo ), 
      ['filters','Filter12SVF'], 
      props
    )

    return __out
  }


  SVF.defaults = {
    input:0,
    Q: .65,
    cutoff:440,
    mode:0
  }

  return SVF

}


},{"./filter.js":14,"genish.js":103}],19:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let BitCrusher = inputProps => {
  const  props = Object.assign( { bitCrusherLength: 44100 }, BitCrusher.defaults, effect.defaults, inputProps ),
         bitCrusher = Object.create( effect )

  let out

  bitCrusher.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    let input = g.in( 'input' ),
        inputGain = g.in( 'inputGain' ),
        bitDepth = g.in( 'bitDepth' ),
        sampleRate = g.in( 'sampleRate' ),
        leftInput = isStereo ? input[ 0 ] : input,
        rightInput = isStereo ? input[ 1 ] : null
    
    let storeL = g.history(0)
    let sampleReduxCounter = g.counter( sampleRate, 0, 1 )

    let bitMult = g.pow( g.mul( bitDepth, 16 ), 2 )
    let crushedL = g.div( g.floor( g.mul( g.mul( leftInput, inputGain ), bitMult ) ), bitMult )

    let outL = g.switch(
      sampleReduxCounter.wrap,
      crushedL,
      storeL.out
    )

    if( isStereo ) {
      let storeR = g.history(0)
      let crushedR = g.div( g.floor( g.mul( g.mul( rightInput, inputGain ), bitMult ) ), bitMult )

      let outR = g.ternary( 
        sampleReduxCounter.wrap,
        crushedR,
        storeL.out
      )

      bitCrusher.graph = [ outL, outR ]
    }else{
      bitCrusher.graph = outL
    }
  }

  bitCrusher.__createGraph()
  bitCrusher.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    bitCrusher,
    bitCrusher.graph,
    ['fx','bitCrusher'], 
    props 
  )
  return out 
}

BitCrusher.defaults = {
  input:0,
  bitDepth:.5,
  sampleRate: .5
}

return BitCrusher

}

},{"./effect.js":25,"genish.js":103}],20:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
  let proto = Object.create( effect )

  let Shuffler = inputProps => {
    let bufferShuffler = Object.create( proto ),
        bufferSize = 88200

    const props = Object.assign( {}, Shuffler.defaults, effect.defaults, inputProps )
    
    let out
    bufferShuffler.__createGraph = function() {
      let isStereo = false
      if( out === undefined ) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : true 
      }else{
        isStereo = out.input.isStereo
        //out.isStereo = isStereo
      }      
      
      const phase = g.accum( 1,0,{ shouldWrap: false })

      const input = g.in( 'input' ),
            inputGain = g.in( 'inputGain' ),
            __leftInput = isStereo ? input[ 0 ] : input,
            __rightInput = isStereo ? input[ 1 ] : null,
            leftInput = g.mul( __leftInput, inputGain ),
            rightInput = g.mul( __rightInput, inputGain ),
            rateOfShuffling = g.in( 'rate' ),
            chanceOfShuffling = g.in( 'chance' ),
            reverseChance = g.in( 'reverseChance' ),
            repitchChance = g.in( 'repitchChance' ),
            repitchMin = g.in( 'repitchMin' ),
            repitchMax = g.in( 'repitchMax' )

      let pitchMemory = g.history(1)

      let shouldShuffleCheck = g.eq( g.mod( phase, rateOfShuffling ), 0 )
      let isShuffling = g.memo( g.sah( g.lt( g.noise(), chanceOfShuffling ), shouldShuffleCheck, 0 ) ) 

      // if we are shuffling and on a repeat boundary...
      let shuffleChanged = g.memo( g.and( shouldShuffleCheck, isShuffling ) )
      let shouldReverse = g.lt( g.noise(), reverseChance ),
          reverseMod = g.switch( shouldReverse, -1, 1 )

      let pitch = g.ifelse( 
        g.and( shuffleChanged, g.lt( g.noise(), repitchChance ) ),
        g.memo( g.mul( g.add( repitchMin, g.mul( g.sub( repitchMax, repitchMin ), g.noise() ) ), reverseMod ) ),
        reverseMod
      )
      
      // only switch pitches on repeat boundaries
      pitchMemory.in( g.switch( shuffleChanged, pitch, pitchMemory.out ) )

      let fadeLength = g.memo( g.div( rateOfShuffling, 100 ) ),
          fadeIncr = g.memo( g.div( 1, fadeLength ) )

      const bufferL = g.data( bufferSize )
      const bufferR = isStereo ? g.data( bufferSize ) : null
      let readPhase = g.accum( pitchMemory.out, 0, { shouldWrap:false }) 
      let stutter = g.wrap( g.sub( g.mod( readPhase, bufferSize ), 22050 ), 0, bufferSize )

      let normalSample = g.peek( bufferL, g.accum( 1, 0, { max:88200 }), { mode:'simple' })

      let stutterSamplePhase = g.switch( isShuffling, stutter, g.mod( readPhase, bufferSize ) )
      let stutterSample = g.memo( g.peek( 
        bufferL, 
        stutterSamplePhase,
        { mode:'samples' }
      ) )
      
      let stutterShouldFadeIn = g.and( shuffleChanged, isShuffling )
      let stutterPhase = g.accum( 1, shuffleChanged, { shouldWrap: false })

      let fadeInAmount = g.memo( g.div( stutterPhase, fadeLength ) )
      let fadeOutAmount = g.div( g.sub( rateOfShuffling, stutterPhase ), g.sub( rateOfShuffling, fadeLength ) )
      
      let fadedStutter = g.ifelse(
        g.lt( stutterPhase, fadeLength ),
        g.memo( g.mul( g.switch( g.lt( fadeInAmount, 1 ), fadeInAmount, 1 ), stutterSample ) ),
        g.gt( stutterPhase, g.sub( rateOfShuffling, fadeLength ) ),
        g.memo( g.mul( g.gtp( fadeOutAmount, 0 ), stutterSample ) ),
        stutterSample
      )
      
      let outputL = g.mix( normalSample, fadedStutter, isShuffling ) 

      let pokeL = g.poke( bufferL, leftInput, g.mod( g.add( phase, 44100 ), 88200 ) )

      let panner = g.pan( outputL, outputL, g.in( 'pan' ) )
      
      bufferShuffler.graph = [ panner.left, panner.right ]
    }

    bufferShuffler.__createGraph()
    bufferShuffler.__requiresRecompilation = [ 'input' ]
    
    out = Gibberish.factory( 
      bufferShuffler,
      bufferShuffler.graph,
      ['fx','shuffler'], 
      props 
    )

    return out 
  }
  
  Shuffler.defaults = {
    input:0,
    rate:22050,
    chance:.25,
    reverseChance:.5,
    repitchChance:.5,
    repitchMin:.5,
    repitchMax:2,
    pan:.5,
    mix:.5
  }

  return Shuffler 
}

},{"./effect.js":25,"genish.js":103}],21:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )
  
module.exports = function( Gibberish ) {
 
let __Chorus = inputProps => {
  const props = Object.assign({}, __Chorus.defaults, effect.defaults, inputProps )
  let out
  
  const chorus = Object.create( effect )

  chorus.__createGraph = function() {
    const input = g.in('input'),
          inputGain = g.in( 'inputGain' ),
          freq1 = g.in('slowFrequency'),
          freq2 = g.in('fastFrequency'),
          amp1  = g.in('slowGain'),
          amp2  = g.in('fastGain')

    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    const win0   = g.env( 'inversewelch', 1024 ),
          win120 = g.env( 'inversewelch', 1024, 0, .333 ),
          win240 = g.env( 'inversewelch', 1024, 0, .666 )
    
    const slowPhasor = g.phasor( freq1, 0, { min:0 }),
          slowPeek1  = g.mul( g.peek( win0,   slowPhasor ), amp1 ),
          slowPeek2  = g.mul( g.peek( win120, slowPhasor ), amp1 ),
          slowPeek3  = g.mul( g.peek( win240, slowPhasor ), amp1 )
    
    const fastPhasor = g.phasor( freq2, 0, { min:0 }),
          fastPeek1  = g.mul( g.peek( win0,   fastPhasor ), amp2 ),
          fastPeek2  = g.mul( g.peek( win120, fastPhasor ), amp2 ),
          fastPeek3  = g.mul( g.peek( win240, fastPhasor ), amp2 )


    let sampleRate = Gibberish.ctx.sampleRate
     
    const ms = sampleRate / 1000 
    const maxDelayTime = 1000 * ms

    //console.log( 'sr:', sampleRate, 'ms:', ms, 'maxDelayTime:', maxDelayTime )

    const time1 =  g.mul( g.add( slowPeek1, fastPeek1, 5 ), ms ),
          time2 =  g.mul( g.add( slowPeek2, fastPeek2, 5 ), ms ),
          time3 =  g.mul( g.add( slowPeek3, fastPeek3, 5 ), ms )

    const delay1L = g.delay( leftInput, time1, { size:maxDelayTime }),
          delay2L = g.delay( leftInput, time2, { size:maxDelayTime }),
          delay3L = g.delay( leftInput, time3, { size:maxDelayTime })

    
    const leftOutput = g.add( delay1L, delay2L, delay3L )
    if( isStereo ) {
      const rightInput = g.mul( input[1], inputGain )
      const delay1R = g.delay(rightInput, time1, { size:maxDelayTime }),
            delay2R = g.delay(rightInput, time2, { size:maxDelayTime }),
            delay3R = g.delay(rightInput, time3, { size:maxDelayTime })

      // flip a couple delay lines for stereo effect?
      const rightOutput = g.add( delay1R, delay2L, delay3R )
      chorus.graph = [ g.add( delay1L, delay2R, delay3L), rightOutput ]
    }else{
      chorus.graph = leftOutput
    }
  }

  chorus.__createGraph()
  chorus.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( chorus, chorus.graph, ['fx','chorus'], props )

  return out 
}

__Chorus.defaults = {
  input:0,
  slowFrequency: .18,
  slowGain:3,
  fastFrequency:6,
  fastGain:1,
  inputGain:1
}

return __Chorus

}

},{"./effect.js":25,"genish.js":103}],22:[function(require,module,exports){
const g = require('genish.js'),
      effect = require('./effect.js');

const genish = g;

"use jsdsp";

const AllPassChain = (in1, in2, in3) => {
  "use jsdsp";

  /* in1 = predelay_out */
  /* in2 = indiffusion1 */
  /* in3 = indiffusion2 */

  const sub1 = genish.sub(in1, 0);
  const d1 = g.delay(sub1, 142);
  sub1.inputs[1] = genish.mul(d1, in2);
  const ap1_out = genish.add(genish.mul(sub1, in2), d1);

  const sub2 = genish.sub(ap1_out, 0);
  const d2 = g.delay(sub2, 107);
  sub2.inputs[1] = genish.mul(d2, in2);
  const ap2_out = genish.add(genish.mul(sub2, in2), d2);

  const sub3 = genish.sub(ap2_out, 0);
  const d3 = g.delay(sub3, 379);
  sub3.inputs[1] = genish.mul(d3, in3);
  const ap3_out = genish.add(genish.mul(sub3, in3), d3);

  const sub4 = genish.sub(ap3_out, 0);
  const d4 = g.delay(sub4, 277);
  sub4.inputs[1] = genish.mul(d4, in3);
  const ap4_out = genish.add(genish.mul(sub4, in3), d4);

  return ap4_out;
};

/*const tank_outs = Tank( ap_out, decaydiffusion1, decaydiffusion2, damping, decay )*/
const Tank = function (in1, in2, in3, in4, in5) {
  "use jsdsp";

  const outs = [[], [], [], [], []];

  /* LEFT CHANNEL */
  const leftStart = genish.add(in1, 0);
  const delayInput = genish.add(leftStart, 0);
  const delay1 = g.delay(delayInput, [genish.add(genish.mul(g.cycle(.1), 16), 672)], { size: 688 });
  delayInput.inputs[1] = genish.mul(delay1, in2);
  const delayOut = genish.sub(delay1, genish.mul(delayInput, in2));

  const delay2 = g.delay(delayOut, [4453, 353, 3627, 1190]);
  outs[3].push(genish.add(delay2.outputs[1], delay2.outputs[2]));
  outs[2].push(delay2.outputs[3]);

  const mz = g.history(0);
  const ml = g.mix(delay2, mz.out, in4);
  mz.in(ml);

  const mout = genish.mul(ml, in5);

  const s1 = genish.sub(mout, 0);
  const delay3 = g.delay(s1, [1800, 187, 1228]);
  outs[2].push(delay3.outputs[1]);
  outs[4].push(delay3.outputs[2]);
  s1.inputs[1] = genish.mul(delay3, in3);
  const m2 = genish.mul(s1, in3);
  const dl2_out = genish.add(delay3, m2);

  const delay4 = g.delay(dl2_out, [3720, 1066, 2673]);
  outs[2].push(delay4.outputs[1]);
  outs[3].push(delay4.outputs[2]);

  /* RIGHT CHANNEL */
  const rightStart = genish.add(genish.mul(delay4, in5), in1);
  const delayInputR = genish.add(rightStart, 0);
  const delay1R = g.delay(delayInputR, genish.add(genish.mul(g.cycle(.07), 16), 908), { size: 924 });
  delayInputR.inputs[1] = genish.mul(delay1R, in2);
  const delayOutR = genish.sub(delay1R, genish.mul(delayInputR, in2));

  const delay2R = g.delay(delayOutR, [4217, 266, 2974, 2111]);
  outs[1].push(genish.add(delay2R.outputs[1], delay2R.outputs[2]));
  outs[4].push(delay2R.outputs[3]);

  const mzR = g.history(0);
  const mlR = g.mix(delay2R, mzR.out, in4);
  mzR.in(mlR);

  const moutR = genish.mul(mlR, in5);

  const s1R = genish.sub(moutR, 0);
  const delay3R = g.delay(s1R, [2656, 335, 1913]);
  outs[4].push(delay3R.outputs[1]);
  outs[2].push(delay3R.outputs[2]);
  s1R.inputs[1] = genish.mul(delay3R, in3);
  const m2R = genish.mul(s1R, in3);
  const dl2_outR = genish.add(delay3R, m2R);

  const delay4R = g.delay(dl2_outR, [3163, 121, 1996]);
  outs[4].push(delay4.outputs[1]);
  outs[1].push(delay4.outputs[2]);

  leftStart.inputs[1] = genish.mul(delay4R, in5);

  outs[1] = g.add(...outs[1]);
  outs[2] = g.add(...outs[2]);
  outs[3] = g.add(...outs[3]);
  outs[4] = g.add(...outs[4]);
  return outs;
};

module.exports = function (Gibberish) {

  const Reverb = inputProps => {
    const props = Object.assign({}, Reverb.defaults, effect.defaults, inputProps),
          reverb = Object.create(effect);

    let out;

    reverb.__createGraph = function () {
      let isStereo = false;
      if (out === undefined) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false;
      } else {
        isStereo = out.input.isStereo;
        out.isStereo = isStereo;
      }

      const input = g.in('input'),
            inputGain = g.in('inputGain'),
            damping = g.in('damping'),
            drywet = g.in('drywet'),
            decay = g.in('decay'),
            predelay = g.in('predelay'),
            inbandwidth = g.in('inbandwidth'),
            decaydiffusion1 = g.in('decaydiffusion1'),
            decaydiffusion2 = g.in('decaydiffusion2'),
            indiffusion1 = g.in('indiffusion1'),
            indiffusion2 = g.in('indiffusion2');

      const summedInput = isStereo === true ? g.mul(g.add(input[0], input[1]), inputGain) : g.mul(input, inputGain);
      {
        'use jsdsp';

        // calculcate predelay
        const predelay_samps = g.mstosamps(predelay);
        const predelay_delay = g.delay(summedInput, predelay_samps, { size: 4410 });
        const z_pd = g.history(0);
        const mix1 = g.mix(z_pd.out, predelay_delay, inbandwidth);
        z_pd.in(mix1);

        const predelay_out = mix1;

        // run input + predelay through all-pass chain
        const ap_out = AllPassChain(predelay_out, indiffusion1, indiffusion2);

        // run filtered signal into "tank" model
        const tank_outs = Tank(ap_out, decaydiffusion1, decaydiffusion2, damping, decay);

        const leftWet = genish.mul(genish.sub(tank_outs[1], tank_outs[2]), .6);
        const rightWet = genish.mul(genish.sub(tank_outs[3], tank_outs[4]), .6);

        // mix wet and dry signal for final output
        const left = g.mix(isStereo ? g.mul(input[0], inputGain) : g.mul(input, inputGain), leftWet, drywet);
        const right = g.mix(isStereo ? g.mul(input[1], inputGain) : g.mul(input, inputGain), rightWet, drywet);

        reverb.graph = [left, right];
      }
    };

    reverb.__createGraph();
    reverb.__requiresRecompilation = ['input'];

    out = Gibberish.factory(reverb, reverb.graph, ['fx', 'plate'], props);

    return out;
  };

  Reverb.defaults = {
    input: 0,
    damping: .5,
    drywet: .5,
    decay: .5,
    predelay: 10,
    inbandwidth: .5,
    indiffusion1: .75,
    indiffusion2: .625,
    decaydiffusion1: .7,
    decaydiffusion2: .5
  };

  return Reverb;
};
},{"./effect.js":25,"genish.js":103}],23:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let Delay = inputProps => {
  let props = Object.assign( { delayLength: 44100 }, effect.defaults, Delay.defaults, inputProps ),
      delay = Object.create( effect )

  let out
  delay.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input      = g.in( 'input' ),
          inputGain  = g.in( 'inputGain' ),
          delayTime  = g.in( 'time' ),
          wetdry     = g.in( 'wetdry' ),
          leftInput  = isStereo ? g.mul( input[ 0 ], inputGain ) : g.mul( input, inputGain ),
          rightInput = isStereo ? g.mul( input[ 1 ], inputGain ) : null
      
    const feedback = g.in( 'feedback' )

    // left channel
    const feedbackHistoryL = g.history()
    const echoL = g.delay( g.add( leftInput, g.mul( feedbackHistoryL.out, feedback ) ), delayTime, { size:props.delayLength })
    feedbackHistoryL.in( echoL )
    const left = g.mix( leftInput, echoL, wetdry )

    if( isStereo ) {
      // right channel
      const feedbackHistoryR = g.history()
      const echoR = g.delay( g.add( rightInput, g.mul( feedbackHistoryR.out, feedback ) ), delayTime, { size:props.delayLength })
      feedbackHistoryR.in( echoR )
      const right = g.mix( rightInput, echoR, wetdry )

      delay.graph = [ left, right ]
    }else{
      delay.graph = left 
    }
  }

  delay.__createGraph()
  delay.__requiresRecompilation = [ 'input' ]
  
  out = Gibberish.factory( 
    delay,
    delay.graph, 
    ['fx','delay'], 
    props 
  )

  return out
}

Delay.defaults = {
  input:0,
  feedback:.5,
  time: 11025,
  wetdry: .5
}

return Delay

}

},{"./effect.js":25,"genish.js":103}],24:[function(require,module,exports){
const g = require('genish.js'),
      effect = require('./effect.js');

const genish = g;

/*

         exp(asig * (shape1 + pregain)) - exp(asig * (shape2 - pregain))
  aout = ---------------------------------------------------------------
         exp(asig * pregain)            + exp(-asig * pregain)

*/

module.exports = function (Gibberish) {

  let Distortion = inputProps => {
    let props = Object.assign({}, effect.defaults, Distortion.defaults, inputProps),
        distortion = Object.create(effect),
        out;

    distortion.__createGraph = function () {
      let isStereo = false;
      if (out === undefined) {
        isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false;
      } else {
        isStereo = out.input.isStereo;
        out.isStereo = isStereo;
      }

      const input = g.in('input'),
            inputGain = g.in('inputGain'),
            shape1 = g.in('shape1'),
            shape2 = g.in('shape2'),
            pregain = g.in('pregain'),
            postgain = g.in('postgain');

      let lout;
      {
        'use jsdsp';
        const linput = isStereo ? g.mul(input[0], inputGain) : g.mul(input, inputGain);
        const ltop = genish.sub(g.exp(genish.mul(linput, genish.add(shape1, pregain))), g.exp(genish.mul(linput, genish.sub(shape2, pregain))));
        const lbottom = genish.add(g.exp(genish.mul(linput, pregain)), g.exp(genish.mul(genish.mul(-1, linput), pregain)));
        lout = genish.mul(genish.div(ltop, lbottom), postgain);
      }

      if (isStereo) {
        let rout;
        {
          'use jsdsp';
          const rinput = isStereo ? g.mul(input[1], inputGain) : g.mul(input, inputGain);
          const rtop = genish.sub(g.exp(genish.mul(rinput, genish.add(shape1, pregain))), g.exp(genish.mul(rinput, genish.sub(shape2, pregain))));
          const rbottom = genish.add(g.exp(genish.mul(rinput, pregain)), g.exp(genish.mul(genish.mul(-1, rinput), pregain)));
          rout = genish.mul(genish.div(rtop, rbottom), postgain);
        }

        distortion.graph = [lout, rout];
      } else {
        distortion.graph = lout;
      }
    };

    distortion.__createGraph();
    distortion.__requiresRecompilation = ['input'];

    out = Gibberish.factory(distortion, distortion.graph, ['fx', 'distortion'], props);
    return out;
  };

  Distortion.defaults = {
    input: 0,
    shape1: .1,
    shape2: .1,
    pregain: 5,
    postgain: .5
  };

  return Distortion;
};
},{"./effect.js":25,"genish.js":103}],25:[function(require,module,exports){
let ugen = require( '../ugen.js' )()

let effect = Object.create( ugen )

Object.assign( effect, {
  defaults: { bypass:false, inputGain:1 },
  type:'effect'
})

module.exports = effect

},{"../ugen.js":62}],26:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const effects = {
    Freeverb    : require( './freeverb.js'  )( Gibberish ),
    Plate       : require( './dattorro.js'  )( Gibberish ),
    Flanger     : require( './flanger.js'   )( Gibberish ),
    Vibrato     : require( './vibrato.js'   )( Gibberish ),
    Delay       : require( './delay.js'     )( Gibberish ),
    BitCrusher  : require( './bitCrusher.js')( Gibberish ),
    Distortion  : require( './distortion.js')( Gibberish ),
    RingMod     : require( './ringMod.js'   )( Gibberish ),
    Tremolo     : require( './tremolo.js'   )( Gibberish ),
    Chorus      : require( './chorus.js'    )( Gibberish ),
    Shuffler    : require( './bufferShuffler.js'  )( Gibberish ),
    //Gate        : require( './gate.js'      )( Gibberish ),
  }

  effects.export = target => {
    for( let key in effects ) {
      if( key !== 'export' ) {
        target[ key ] = effects[ key ]
      }
    }
  }

return effects

}

},{"./bitCrusher.js":19,"./bufferShuffler.js":20,"./chorus.js":21,"./dattorro.js":22,"./delay.js":23,"./distortion.js":24,"./flanger.js":27,"./freeverb.js":28,"./ringMod.js":29,"./tremolo.js":30,"./vibrato.js":31}],27:[function(require,module,exports){
let g = require( 'genish.js' ),
    proto = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let Flanger = inputProps => {
  let props   = Object.assign( { delayLength:44100 }, Flanger.defaults, proto.defaults, inputProps ),
      flanger = Object.create( proto ),
      out

  flanger.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          delayLength = props.delayLength,
          feedbackCoeff = g.in( 'feedback' ),
          modAmount = g.in( 'offset' ),
          frequency = g.in( 'frequency' ),
          delayBufferL = g.data( delayLength )

    const writeIdx = g.accum( 1,0, { min:0, max:delayLength, interp:'none', mode:'samples' })
    
    const offset = g.mul( modAmount, 500 )

    const mod = props.mod === undefined ? g.cycle( frequency ) : props.mod
    
    const readIdx = g.wrap( 
      g.add( 
        g.sub( writeIdx, offset ), 
        mod//g.mul( mod, g.sub( offset, 1 ) ) 
      ), 
      0, 
      delayLength
    )

    const leftInput = isStereo ? input[0] : input

    const delayedOutL = g.peek( delayBufferL, readIdx, { interp:'linear', mode:'samples' })
    
    g.poke( delayBufferL, g.add( leftInput, g.mul( delayedOutL, feedbackCoeff ) ), writeIdx )

    const left = g.add( leftInput, delayedOutL )

    if( isStereo === true ) {
      const rightInput = input[1]
      const delayBufferR = g.data( delayLength )
      
      let delayedOutR = g.peek( delayBufferR, readIdx, { interp:'linear', mode:'samples' })

      g.poke( delayBufferR, g.add( rightInput, g.mul( delayedOutR, feedbackCoeff ) ), writeIdx )
      const right = g.add( rightInput, delayedOutR )

      flanger.graph = [ left, right ]

    }else{
      flanger.graph = left
    }
  }

  flanger.__createGraph()
  flanger.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    flanger,
    flanger.graph, 
    ['fx','flanger'], 
    props 
  ) 

  return out 
}

Flanger.defaults = {
  input:0,
  feedback:.01,
  offset:.25,
  frequency:.5
}

return Flanger

}

},{"./effect.js":25,"genish.js":103}],28:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
  
const allPass = Gibberish.filters.genish.AllPass
const combFilter = Gibberish.filters.genish.Comb

const tuning = {
  combCount:	  	8,
  combTuning: 		[ 1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617 ],                    
  allPassCount: 	4,
  allPassTuning:	[ 225, 556, 441, 341 ],
  allPassFeedback:0.5,
  fixedGain: 		  0.015,
  scaleDamping: 	0.4,
  scaleRoom: 		  0.28,
  offsetRoom: 	  0.7,
  stereoSpread:   23
}

const Freeverb = inputProps => {
  const props = Object.assign( {}, effect.defaults, Freeverb.defaults, inputProps ),
        reverb = Object.create( effect ) 

  let out 
  reverb.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
    }    

    const combsL = [], combsR = []

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          wet1 = g.in( 'wet1'),
          wet2 = g.in( 'wet2' ),  
          dry = g.in( 'dry' ), 
          roomSize = g.in( 'roomSize' ), 
          damping = g.in( 'damping' )
    
    const __summedInput = isStereo === true ? g.add( input[0], input[1] ) : input,
         summedInput = g.mul( __summedInput, inputGain ),
         attenuatedInput = g.memo( g.mul( summedInput, tuning.fixedGain ) )
    
    // create comb filters in parallel...
    for( let i = 0; i < 8; i++ ) { 
      combsL.push( 
        combFilter( 
          attenuatedInput, 
          tuning.combTuning[i], 
          g.mul(damping,.4),
          g.mul( tuning.scaleRoom + tuning.offsetRoom, roomSize ) 
        ) 
      )
      combsR.push( 
        combFilter( 
          attenuatedInput, 
          tuning.combTuning[i] + tuning.stereoSpread, 
          g.mul(damping,.4), 
          g.mul( tuning.scaleRoom + tuning.offsetRoom, roomSize ) 
        ) 
      )
    }
    
    // ... and sum them with attenuated input, use of let is deliberate here
    let outL = g.add( attenuatedInput, ...combsL )
    let outR = g.add( attenuatedInput, ...combsR )
    
    // run through allpass filters in series
    for( let i = 0; i < 4; i++ ) { 
      outL = allPass( outL, tuning.allPassTuning[ i ] + tuning.stereoSpread )
      outR = allPass( outR, tuning.allPassTuning[ i ] + tuning.stereoSpread )
    }
    
    const outputL = g.add( g.mul( outL, wet1 ), g.mul( outR, wet2 ), g.mul( isStereo === true ? input[0] : input, dry ) ),
          outputR = g.add( g.mul( outR, wet1 ), g.mul( outL, wet2 ), g.mul( isStereo === true ? input[1] : input, dry ) )

    reverb.graph = [ outputL, outputR ]
  }

  reverb.__createGraph()
  reverb.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( reverb, reverb.graph, ['fx','freeverb'], props )

  return out
}


Freeverb.defaults = {
  input: 0,
  wet1: 1,
  wet2: 0,
  dry: .5,
  roomSize: .925,
  damping:  .5,
}

return Freeverb 

}


},{"./effect.js":25,"genish.js":103}],29:[function(require,module,exports){
let g = require( 'genish.js' ),
    effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
let RingMod = inputProps => {
  let props   = Object.assign( {}, RingMod.defaults, effect.defaults, inputProps ),
      ringMod = Object.create( effect ),
      out

  ringMod.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          frequency = g.in( 'frequency' ),
          gain = g.in( 'gain' ),
          mix = g.in( 'mix' )
    
    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain ),
          sine = g.mul( g.cycle( frequency ), gain )
   
    const left = g.add( g.mul( leftInput, g.sub( 1, mix )), g.mul( g.mul( leftInput, sine ), mix ) ) 
        
    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain ),
            right = g.add( g.mul( rightInput, g.sub( 1, mix )), g.mul( g.mul( rightInput, sine ), mix ) ) 
      
      ringMod.graph = [ left, right ]
    }else{
      ringMod.graph = left
    }
  }

  ringMod.__createGraph() 
  ringMod.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    ringMod,
    ringMod.graph, 
    [ 'fx','ringMod'], 
    props 
  )
  
  return out 
}

RingMod.defaults = {
  input:0,
  frequency:220,
  gain: 1, 
  mix:1
}

return RingMod

}

},{"./effect.js":25,"genish.js":103}],30:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
const Tremolo = inputProps => {
  const props   = Object.assign( {}, Tremolo.defaults, effect.defaults, inputProps ),
        tremolo = Object.create( effect )
  
  let out
  tremolo.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          frequency = g.in( 'frequency' ),
          amount = g.in( 'amount' )
    
    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    let osc
    if( props.shape === 'square' ) {
      osc = g.gt( g.phasor( frequency ), 0 )
    }else if( props.shape === 'saw' ) {
      osc = g.gtp( g.phasor( frequency ), 0 )
    }else{
      osc = g.cycle( frequency )
    }

    const mod = g.mul( osc, amount )
   
    const left = g.sub( leftInput, g.mul( leftInput, mod ) )

    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain ),
            right = g.mul( rightInput, mod )

      tremolo.graph = [ left, right ]
    }else{
      tremolo.graph = left
    }
  }
  
  tremolo.__createGraph()
  tremolo.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    tremolo,
    tremolo.graph,
    ['fx','tremolo'], 
    props 
  ) 
  return out 
}

Tremolo.defaults = {
  input:0,
  frequency:2,
  amount: 1, 
  shape:'sine'
}

return Tremolo

}

},{"./effect.js":25,"genish.js":103}],31:[function(require,module,exports){
const g = require( 'genish.js' ),
      effect = require( './effect.js' )

module.exports = function( Gibberish ) {
 
const Vibrato = inputProps => {
  const props   = Object.assign( {}, Vibrato.defaults, effect.defaults, inputProps ),
        vibrato = Object.create( effect )

  let out
  vibrato.__createGraph = function() {
    let isStereo = false
    if( out === undefined ) {
      isStereo = typeof props.input.isStereo !== 'undefined' ? props.input.isStereo : false 
    }else{
      isStereo = out.input.isStereo
      out.isStereo = isStereo
    }    

    const input = g.in( 'input' ),
          inputGain = g.in( 'inputGain' ),
          delayLength = 44100,
          feedbackCoeff = g.in( 'feedback' ),
          modAmount = g.in( 'amount' ),
          frequency = g.in( 'frequency' ),
          delayBufferL = g.data( delayLength )

    const writeIdx = g.accum( 1,0, { min:0, max:delayLength, interp:'none', mode:'samples' })
    
    const offset = g.mul( modAmount, 500 )
    
    const readIdx = g.wrap( 
      g.add( 
        g.sub( writeIdx, offset ), 
        g.mul( g.cycle( frequency ), g.sub( offset, 1 ) ) 
      ), 
      0, 
      delayLength
    )

    const leftInput = isStereo ? g.mul( input[0], inputGain ) : g.mul( input, inputGain )

    const delayedOutL = g.peek( delayBufferL, readIdx, { interp:'linear', mode:'samples' })
    
    g.poke( delayBufferL, g.add( leftInput, g.mul( delayedOutL, feedbackCoeff ) ), writeIdx )

    const left = delayedOutL

    if( isStereo === true ) {
      const rightInput = g.mul( input[1], inputGain )
      const delayBufferR = g.data( delayLength )
      
      const delayedOutR = g.peek( delayBufferR, readIdx, { interp:'linear', mode:'samples' })

      g.poke( delayBufferR, g.add( rightInput, mul( delayedOutR, feedbackCoeff ) ), writeIdx )
      const right = delayedOutR

      vibrato.graph = [ left, right ]
    }else{
      vibrato.graph = left 
    }
  }

  vibrato.__createGraph()
  vibrato.__requiresRecompilation = [ 'input' ]

  out = Gibberish.factory( 
    vibrato,
    vibrato.graph,    
    [ 'fx', 'vibrato' ], 
    props 
  ) 
  return out 
}

Vibrato.defaults = {
  input:0,
  feedback:.01,
  amount:.5,
  frequency:4
}

return Vibrato

}

},{"./effect.js":25,"genish.js":103}],32:[function(require,module,exports){
let MemoryHelper = require( 'memory-helper' ),
    genish       = require( 'genish.js' )
    
let Gibberish = {
  blockCallbacks: [], // called every block
  dirtyUgens: [],
  callbackUgens: [],
  callbackNames: [],
  analyzers: [],
  graphIsDirty: false,
  ugens: {},
  debug: false,
  id: -1,
  preventProxy:false,
  proxyEnabled: true,

  output: null,

  memory : null, // 20 minutes by default?
  factory: null, 
  genish,
  scheduler: require( './scheduling/scheduler.js' ),
  //workletProcessorLoader: require( './workletProcessor.js' ),
  workletProcessor: null,

  memoed: {},
  mode:'scriptProcessor',

  prototypes: {
    ugen: null,//require('./ugen.js'),
    instrument: require( './instruments/instrument.js' ),
    effect: require( './fx/effect.js' ),
  },

  mixins: {
    polyinstrument: require( './instruments/polyMixin.js' )
  },

  workletPath: './gibberish_worklet.js',
  init( memAmount, ctx, mode=null, sac=null ) {

    let numBytes = isNaN( memAmount ) ? 20 * 60 * 44100 : memAmount

    // regardless of whether or not gibberish is using worklets,
    // we still want genish to output vanilla js functions instead
    // of audio worklet classes; these functions will be called
    // from within the gibberish audioworklet processor node.
    this.genish.gen.mode = 'scriptProcessor'

    this.memory = MemoryHelper.create( numBytes, Float64Array )

    this.mode = window.AudioWorklet !== undefined ? 'worklet' : 'scriptprocessor'
    if( mode !== null ) this.mode = mode

    this.hasWorklet = window.AudioWorklet !== undefined && typeof window.AudioWorklet === 'function'

    const startup = this.hasWorklet ? this.utilities.createWorklet : this.utilities.createScriptProcessor
    
    this.analyzers.dirty = false

    if( this.mode === 'worklet' ) {

      const p = new Promise( (resolve, reject ) => {

        const pp = new Promise( (__resolve, __reject ) => {
          this.utilities.createContext( ctx, startup.bind( this.utilities ), __resolve, sac )
        }).then( ()=> {
          Gibberish.preventProxy = true
          Gibberish.load()
          Gibberish.output = this.Bus2()
          Gibberish.preventProxy = false

          resolve()
        })

      })
      
      return p

    }else if( this.mode === 'processor' ) {
      Gibberish.load()
      Gibberish.output = this.Bus2()
      Gibberish.callback = Gibberish.generateCallback()
    }
  },

  load() {
    this.factory = require( './ugenTemplate.js' )( this )
    
    this.Panner       = require( './misc/panner.js' )( this )
    this.PolyTemplate = require( './instruments/polytemplate.js' )( this )
    this.oscillators  = require( './oscillators/oscillators.js' )( this )
    this.filters      = require( './filters/filters.js' )( this )
    this.binops       = require( './misc/binops.js' )( this )
    this.monops       = require( './misc/monops.js' )( this )
    this.Bus          = require( './misc/bus.js' )( this )
    this.Bus2         = require( './misc/bus2.js' )( this );
    this.instruments  = require( './instruments/instruments.js' )( this )
    this.fx           = require( './fx/effects.js' )( this )
    this.Sequencer    = require( './scheduling/sequencer.js' )( this );
    this.Sequencer2   = require( './scheduling/seq2.js' )( this );
    this.envelopes    = require( './envelopes/envelopes.js' )( this );
    this.analysis     = require( './analysis/analyzers.js' )( this )
    this.time         = require( './misc/time.js' )( this )
    this.Proxy        = require( './workletProxy.js' )( this )
  },

  export( target, shouldExportGenish=false ) {
    if( target === undefined ) throw Error('You must define a target object for Gibberish to export variables to.')

    if( shouldExportGenish ) this.genish.export( target )

    this.instruments.export( target )
    this.fx.export( target )
    this.filters.export( target )
    this.oscillators.export( target )
    this.binops.export( target )
    this.monops.export( target )
    this.envelopes.export( target )
    this.analysis.export( target )
    target.Sequencer = this.Sequencer
    target.Sequencer2 = this.Sequencer2
    target.Bus = this.Bus
    target.Bus2 = this.Bus2
    target.Scheduler = this.scheduler
    this.time.export( target )
    this.utilities.export( target )
  },

  print() {
    console.log( this.callback.toString() )
  },

  dirty( ugen ) {
    if( ugen === this.analyzers ) {
      this.graphIsDirty = true
      this.analyzers.dirty = true
    } else {
      this.dirtyUgens.push( ugen )
      this.graphIsDirty = true
      if( this.memoed[ ugen.ugenName ] ) {
        delete this.memoed[ ugen.ugenName ]
      }
    } 
  },

  clear() {
    // do not delete the gain and the pan of the master bus 
    this.output.inputs.splice( 0, this.output.inputs.length - 2 )
    //this.output.inputNames.length = 0
    this.analyzers.length = 0
    this.scheduler.clear()
    this.dirty( this.output )
    if( this.mode === 'worklet' ) {
      this.worklet.port.postMessage({ 
        address:'method', 
        object:this.id,
        name:'clear',
        args:[]
      })
    }
      // clear memory... XXX should this be a MemoryHelper function?
    //this.memory.heap.fill(0)
    //this.memory.list = {}
    //Gibberish.output = this.Bus2()
    
  },

  // used to sort analysis ugens by priority.
  // higher priorities mean lower ordering in the array,
  // which means they will run first in the callback function.
  // by defult, analysis ugens are assigned a priority of 0 in the
  // analysis prototype.
  analysisCompare( a,b ) {
    return b.priority - a.priority
  },

  generateCallback() {
    if( this.mode === 'worklet' ) {
      Gibberish.callback = function() { return 0 }
      return Gibberish.callback
    }
    let uid = 0,
        callbackBody, lastLine, analysis=''

    this.memoed = {}

    callbackBody = this.processGraph( this.output )
    lastLine = callbackBody[ callbackBody.length - 1]
    callbackBody.unshift( "\t'use strict'" )

    this.analyzers.sort( this.analysisCompare )
    this.analyzers.forEach( v=> {
      const analysisBlock = Gibberish.processUgen( v )
      //if( Gibberish.mode === 'processor' ) {
      //  console.log( 'analysis:', analysisBlock, v  )
      //}
      let analysisLine

      if( typeof analysisBlock === 'object' ) {
        analysisLine = analysisBlock.pop()

        analysisBlock.forEach( v => {
          callbackBody.splice( callbackBody.length - 1, 0, v )
        })
      }else{
        analysisLine = analysisBlock
      }

      callbackBody.push( analysisLine )
    })

    this.analyzers.forEach( v => {
      if( this.callbackUgens.indexOf( v.callback ) === -1 )
        this.callbackUgens.push( v.callback )
    })
    this.callbackNames = this.callbackUgens.map( v => v.ugenName )

    callbackBody.push( '\n\treturn ' + lastLine.split( '=' )[0].split( ' ' )[1] )

    if( this.debug === true ) console.log( 'callback:\n', callbackBody.join('\n') )
    this.callbackNames.push( 'mem' )
    this.callbackUgens.push( this.memory.heap )
    this.callback = Function( ...this.callbackNames, callbackBody.join( '\n' ) )//.bind( null, ...this.callbackUgens )
    this.callback.out = []

    if( this.oncallback ) this.oncallback( this.callback )

    return this.callback 
  },

  processGraph( output ) {
    this.callbackUgens.length = 0
    this.callbackNames.length = 0

    this.callbackUgens.push( output.callback )

    let body = this.processUgen( output )
    

    this.dirtyUgens.length = 0
    this.graphIsDirty = false

    return body
  },
  proxyReplace( obj ) {
    if( typeof obj === 'object' && obj !== null ) {
      if( obj.id !== undefined ) {
        const __obj = processor.ugens.get( obj.id )
        //console.log( 'retrieved:', __obj.name )

        //if( obj.prop !== undefined ) console.log( 'got a ssd.out', obj )
        return obj.prop !== undefined ? __obj[ obj.prop ] : __obj
      }else if( obj.isFunc === true ) {
        let func =  eval( '(' + obj.value + ')' )

        //console.log( 'replacing function:', func )

        return func
      }
    }

    return obj
  },
  processUgen( ugen, block ) {
    if( block === undefined ) block = []

    let dirtyIdx = Gibberish.dirtyUgens.indexOf( ugen )

    //console.log( 'ugenName:', ugen.ugenName )
    let memo = Gibberish.memoed[ ugen.ugenName ]

    if( memo !== undefined ) {
      return memo
    } else if (ugen === true || ugen === false) {
      throw "Why is ugen a boolean? [true] or [false]";
    } else if( ugen.block === undefined || dirtyIndex !== -1 ) {

  
      let line = `\tconst v_${ugen.id} = ` 
      
      if( !ugen.isop ) line += `${ugen.ugenName}( `

      // must get array so we can keep track of length for comma insertion
      let keys,err

      //try {
      keys = ugen.isop === true || ugen.type === 'bus' || ugen.type === 'analysis' ? Object.keys( ugen.inputs ) : [...ugen.inputNames ] 

      //}catch( e ){

      //  console.log( e )
      //  err = true
      //}
      
      //if( err === true ) return

      for( let i = 0; i < keys.length; i++ ) {
        let key = keys[ i ]
        // binop.inputs is actual values, not just property names
        let input 
        if( ugen.isop || ugen.type ==='bus' || ugen.type === 'analysis' ) {
          input = ugen.inputs[ key ]
        }else{
          //if( key === 'memory' ) continue;
  
          //console.log( 'ugen:', ugen, 'key:', key )
          input = ugen[ key ] 
        }

        //if( Gibberish.mode === 'processor' ) console.log( 'processor input:', key, input )
        if( input !== undefined ) { 
          if( input.bypass === true ) {
            // loop through inputs of chain until one is found
            // that is not being bypassed

            let found = false

            while( input.input !== 'undefined' && found === false ) {
              if( typeof input.input.bypass !== 'undefined' ) {
                input = input.input
                if( input.bypass === false ) found = true
              }else{
                input = input.input
                found = true
              }
            }
          }

          if( typeof input === 'number' ) {
            if( isNaN(key) ) {
              line += `mem[${ugen.__addresses__[ key ]}]`//input
            }else{
              line += input
            }
          } else if( typeof input === 'boolean' ) {
            line += '' + input
          }else{
            //console.log( 'key:', key, 'input:', ugen.inputs, ugen.inputs[ key ] ) 
            // XXX not sure why this has to be here, but somehow non-processed objects
            // that only contain id numbers are being passed here...

            if( Gibberish.mode === 'processor' ) {
              if( input.ugenName === undefined && input.id !== undefined ) {
                input = Gibberish.processor.ugens.get( input.id )
              }
            }

            Gibberish.processUgen( input, block )

            //if( input.callback === undefined ) continue

            if( !input.isop ) {
              // check is needed so that graphs with ssds that refer to themselves
              // don't add the ssd in more than once
              if( Gibberish.callbackUgens.indexOf( input.callback ) === -1 ) {
                Gibberish.callbackUgens.push( input.callback )
              }
            }

            line += `v_${input.id}`
            input.__varname = `v_${input.id}`
          }

          if( i < keys.length - 1 ) {
            if( ugen.isop === true ) {
              if( ugen.op === '*' || ugen.op === '/' ) {
                if( input != 1 ) {
                  line += ' ' + ugen.op + ' '
                }else{
                  line = line.slice( 0, -1 * (''+input).length )
                }
              }else{
                line += ' ' + ugen.op + ' '
              }
            }else{
              line += ', '
            }
          }
        }
      }
      
      //if( ugen.type === 'bus' ) line += ', ' 
      if( ugen.type === 'analysis' || (ugen.type === 'bus' && keys.length > 0) ) line += ', '
      if( !ugen.isop && ugen.type !== 'seq' ) line += 'mem'
      line += ugen.isop ? '' : ' )'

      block.push( line )
      
      //console.log( 'memo:', ugen.ugenName )
      Gibberish.memoed[ ugen.ugenName ] = `v_${ugen.id}`

      if( dirtyIdx !== -1 ) {
        Gibberish.dirtyUgens.splice( dirtyIdx, 1 )
      }

    }else if( ugen.block ) {
      return ugen.block
    }

    return block
  },
    
}

Gibberish.prototypes.Ugen = require( './ugen.js' )( Gibberish )
Gibberish.utilities = require( './utilities.js' )( Gibberish )


module.exports = Gibberish

},{"./analysis/analyzers.js":2,"./envelopes/envelopes.js":7,"./filters/filters.js":16,"./fx/effect.js":25,"./fx/effects.js":26,"./instruments/instrument.js":37,"./instruments/instruments.js":38,"./instruments/polyMixin.js":42,"./instruments/polytemplate.js":43,"./misc/binops.js":48,"./misc/bus.js":49,"./misc/bus2.js":50,"./misc/monops.js":51,"./misc/panner.js":52,"./misc/time.js":53,"./oscillators/oscillators.js":56,"./scheduling/scheduler.js":59,"./scheduling/seq2.js":60,"./scheduling/sequencer.js":61,"./ugen.js":62,"./ugenTemplate.js":63,"./utilities.js":64,"./workletProxy.js":65,"genish.js":103,"memory-helper":141}],33:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Conga = argumentProps => {
    let conga = Object.create( instrument ),
        frequency = g.in( 'frequency' ),
        decay = g.in( 'decay' ),
        gain  = g.in( 'gain' ),
        loudness = g.in( 'loudness' )

    let props = Object.assign( {}, Conga.defaults, argumentProps )

    let trigger = g.bang(),
        impulse = g.mul( trigger, 60 ),
        _decay =  g.sub( .101, g.div( decay, 10 ) ), // create range of .001 - .099
        bpf = g.svf( impulse, frequency, _decay, 2, false ),
        out = g.mul( bpf, g.mul( loudness, gain ) )
    

    conga.env = trigger
    Gibberish.factory( conga, out, ['instruments','conga'], props  )

    return conga
  }
  
  Conga.defaults = {
    gain: .25,
    frequency:190,
    decay: .85,
    loudness: 1
  }

  return Conga

}

},{"./instrument.js":37,"genish.js":103}],34:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Cowbell = argumentProps => {
    let cowbell = Object.create( instrument )
    
    const decay   = g.in( 'decay' ),
          gain    = g.in( 'gain' ),
          loudness = g.in( 'loudness' )

    const props = Object.assign( {}, Cowbell.defaults, argumentProps )

    const bpfCutoff = g.param( 'bpfc', 1000 ),
          s1 = Gibberish.oscillators.factory( 'square', 560 ),
          s2 = Gibberish.oscillators.factory( 'square', 845 ),
          eg = g.decay( g.mul( decay, g.gen.samplerate * 2 ) ), 
          bpf = g.svf( g.add( s1,s2 ), bpfCutoff, 3, 2, false ),
          envBpf = g.mul( bpf, eg ),
          out = g.mul( envBpf, g.mul( gain, loudness ) )

    cowbell.env = eg 

    cowbell.isStereo = false

    cowbell = Gibberish.factory( cowbell, out, ['instruments', 'cowbell'], props  )
    
    return cowbell
  }
  
  Cowbell.defaults = {
    gain: 1,
    decay:.5,
    loudness:1
  }

  return Cowbell

}

},{"./instrument.js":37,"genish.js":103}],35:[function(require,module,exports){
const g = require('genish.js'),
      instrument = require('./instrument.js');

const genish = g;

module.exports = function (Gibberish) {

  const FM = inputProps => {
    let syn = Object.create(instrument);

    let frequency = g.in('frequency'),
        glide = g.in('glide'),
        slidingFreq = g.slide(frequency, glide, glide),
        cmRatio = g.in('cmRatio'),
        index = g.in('index'),
        feedback = g.in('feedback'),
        attack = g.in('attack'),
        decay = g.in('decay'),
        sustain = g.in('sustain'),
        sustainLevel = g.in('sustainLevel'),
        release = g.in('release'),
        loudness = g.in('loudness');

    const props = Object.assign({}, FM.defaults, inputProps);
    Object.assign(syn, props);

    syn.__createGraph = function () {
      const env = Gibberish.envelopes.factory(props.useADSR, props.shape, attack, decay, sustain, sustainLevel, release, props.triggerRelease);

      const feedbackssd = g.history(0);

      const modOsc = Gibberish.oscillators.factory(syn.modulatorWaveform, g.add(g.mul(slidingFreq, cmRatio), g.mul(feedbackssd.out, feedback, index)), syn.antialias);

      {
        'use jsdsp';
        const modOscWithIndex = genish.mul(genish.mul(genish.mul(modOsc, slidingFreq), index), loudness);
        const modOscWithEnv = genish.mul(modOscWithIndex, env);

        const modOscWithEnvAvg = genish.mul(.5, genish.add(modOscWithEnv, feedbackssd.out));

        feedbackssd.in(modOscWithEnvAvg);

        const carrierOsc = Gibberish.oscillators.factory(syn.carrierWaveform, g.add(slidingFreq, modOscWithEnvAvg), syn.antialias);
        const carrierOscWithEnv = genish.mul(carrierOsc, env);

        const baseCutoffFreq = genish.mul(g.in('cutoff'), frequency);
        const cutoff = genish.mul(genish.mul(baseCutoffFreq, g.pow(2, genish.mul(g.in('filterMult'), loudness))), env);
        //const cutoff = g.add( g.in('cutoff'), g.mul( g.in('filterMult'), env ) )
        const filteredOsc = Gibberish.filters.factory(carrierOscWithEnv, cutoff, g.in('Q'), g.in('saturation'), syn);

        const synthWithGain = genish.mul(genish.mul(filteredOsc, g.in('gain')), loudness);

        let panner;
        if (genish.eq(props.panVoices, true)) {
          panner = g.pan(synthWithGain, synthWithGain, g.in('pan'));
          syn.graph = [panner.left, panner.right];
        } else {
          syn.graph = synthWithGain;
        }
      }

      syn.env = env;
    };

    syn.__requiresRecompilation = ['carrierWaveform', 'modulatorWaveform', 'antialias', 'filterType', 'filterMode'];
    syn.__createGraph();

    const out = Gibberish.factory(syn, syn.graph, ['instruments', 'FM'], props);

    return out;
  };

  FM.defaults = {
    carrierWaveform: 'sine',
    modulatorWaveform: 'sine',
    attack: 44,
    feedback: 0,
    decay: 22050,
    sustain: 44100,
    sustainLevel: .6,
    release: 22050,
    useADSR: false,
    shape: 'linear',
    triggerRelease: false,
    gain: .25,
    cmRatio: 2,
    index: 5,
    pulsewidth: .25,
    frequency: 220,
    pan: .5,
    antialias: false,
    panVoices: false,
    glide: 1,
    saturation: 1,
    filterMult: 1.5,
    Q: .25,
    cutoff: .35,
    filterType: 0,
    filterMode: 0,
    isLowPass: 1,
    loudness: 1

  };

  const PolyFM = Gibberish.PolyTemplate(FM, ['glide', 'frequency', 'attack', 'decay', 'pulsewidth', 'pan', 'gain', 'cmRatio', 'index', 'saturation', 'filterMult', 'Q', 'cutoff', 'antialias', 'filterType', 'carrierWaveform', 'modulatorWaveform', 'filterMode', 'feedback', 'useADSR', 'sustain', 'release', 'sustainLevel']);
  PolyFM.defaults = FM.defaults;

  return [FM, PolyFM];
};
},{"./instrument.js":37,"genish.js":103}],36:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  let Hat = argumentProps => {
    let hat = Object.create( instrument ),
        tune  = g.in( 'tune' ),
        scaledTune = g.memo( g.add( .4, tune ) ),
        decay  = g.in( 'decay' ),
        gain  = g.in( 'gain' ),
        loudness = g.in( 'loudness' )

    let props = Object.assign( {}, Hat.defaults, argumentProps )

    let baseFreq = g.mul( 325, scaledTune ), // range of 162.5 - 487.5
        bpfCutoff = g.mul( g.param( 'bpfc', 7000 ), scaledTune ),
        hpfCutoff = g.mul( g.param( 'hpfc', 11000 ), scaledTune ),  
        s1 = Gibberish.oscillators.factory( 'square', baseFreq, false ),
        s2 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.4471 ) ),
        s3 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.6170 ) ),
        s4 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,1.9265 ) ),
        s5 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,2.5028 ) ),
        s6 = Gibberish.oscillators.factory( 'square', g.mul( baseFreq,2.6637 ) ),
        sum = g.add( s1,s2,s3,s4,s5,s6 ),
        eg = g.decay( g.mul( decay, g.gen.samplerate * 2 ), { initValue:0 }), 
        bpf = g.svf( sum, bpfCutoff, .5, 2, false ),
        envBpf = g.mul( bpf, eg ),
        hpf = g.filter24( envBpf, 0, hpfCutoff, 0 ),
        out = g.mul( hpf, g.mul( gain, loudness ) )

    hat.env = eg 
    hat.isStereo = false

    const __hat = Gibberish.factory( hat, out, ['instruments','hat'], props  )
    

    return __hat
  }
  
  Hat.defaults = {
    gain:  .5,
    tune: .6,
    decay:.1,
    loudness:1
  }

  return Hat

}

},{"./instrument.js":37,"genish.js":103}],37:[function(require,module,exports){
const ugen = require( '../ugen.js' )()

const instrument = Object.create( ugen )

Object.assign( instrument, {
  type:'instrument',

  note( freq, loudness=null ) {
    // if binop is should be used...
    if( isNaN( this.frequency ) ) { 
      // and if we are assigning binop for the first time...
      if( this.frequency.isop !== true ) {
        let obj = Gibberish.processor.ugens.get( this.frequency.id )
        obj.inputs[0] = freq
        this.frequency = obj
      }else{
        this.frequency.inputs[0] = freq
        Gibberish.dirty( this )
      }
    }else{
      this.frequency = freq
    }

    if( loudness !== null ) this.loudness = loudness 

    this.env.trigger()
  },

  trigger( loudness = 1 ) {
    this.loudness = loudness
    this.env.trigger()
  },

})

module.exports = instrument

},{"../ugen.js":62}],38:[function(require,module,exports){
module.exports = function( Gibberish ) {

const instruments = {
  Kick        : require( './kick.js' )( Gibberish ),
  Conga       : require( './conga.js' )( Gibberish ),
  Clave       : require( './conga.js' )( Gibberish ), // clave is same as conga with different defaults, see below
  Hat         : require( './hat.js' )( Gibberish ),
  Snare       : require( './snare.js' )( Gibberish ),
  Cowbell     : require( './cowbell.js' )( Gibberish ),
  Tom         : require( './tom.js' )( Gibberish )
}

instruments.Clave.defaults.frequency = 2500
instruments.Clave.defaults.decay = .5;

[ instruments.Synth, instruments.PolySynth ]     = require( './synth.js' )( Gibberish );
[ instruments.Monosynth, instruments.PolyMono ]  = require( './monosynth.js' )( Gibberish );
[ instruments.FM, instruments.PolyFM ]           = require( './fm.js' )( Gibberish );
[ instruments.Sampler, instruments.PolySampler ] = require( './sampler.js' )( Gibberish );
[ instruments.Karplus, instruments.PolyKarplus ] = require( './karplusstrong.js' )( Gibberish );

instruments.export = target => {
  for( let key in instruments ) {
    if( key !== 'export' ) {
      target[ key ] = instruments[ key ]
    }
  }
}

return instruments

}

},{"./conga.js":33,"./cowbell.js":34,"./fm.js":35,"./hat.js":36,"./karplusstrong.js":39,"./kick.js":40,"./monosynth.js":41,"./sampler.js":44,"./snare.js":45,"./synth.js":46,"./tom.js":47}],39:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Karplus = inputProps => {

    const props = Object.assign( {}, Karplus.defaults, inputProps )
    let syn = Object.create( instrument )
    
    let sampleRate = Gibberish.ctx.sampleRate 

    const trigger = g.bang(),
          // high initialValue stops triggering on initialization
          phase = g.accum( 1, trigger, { shouldWrapMax:false, initialValue:1000000 } ),
          env = g.gtp( g.sub( 1, g.div( phase, 200 ) ), 0 ),
          impulse = g.mul( g.noise(), env ),
          feedback = g.history(),
          frequency = g.in('frequency'),
          glide = g.in( 'glide' ),
          slidingFrequency = g.slide( frequency, glide, glide ),
          delay = g.delay( g.add( impulse, feedback.out ), g.div( sampleRate, slidingFrequency )),
          decayed = g.mul( delay, g.t60( g.mul( g.in('decay'), slidingFrequency ) ) ),
          damped =  g.mix( decayed, feedback.out, g.in('damping') ),
          n = g.noise(),
          blendValue = g.switch( g.gt( n, g.in('blend') ), -1, 1 ), 
          withGain = g.mul( g.mul( blendValue, damped ), g.mul( g.in('loudness'), g.in('gain') ) )

    feedback.in( damped )

    const properties = Object.assign( {}, Karplus.defaults, props )

    Object.assign( syn, {
      properties : props,

      env : trigger,
      phase,

      getPhase() {
        return Gibberish.memory.heap[ phase.memory.value.idx ]
      },
    })

    if( properties.panVoices ) {  
      const panner = g.pan( withGain, withGain, g.in( 'pan' ) )
      syn = Gibberish.factory( syn, [panner.left, panner.right], ['instruments','karplus'], props  )
    }else{
      syn = Gibberish.factory( syn, withGain, ['instruments','karplus'], props )
    }

    return syn
  }
  
  Karplus.defaults = {
    decay: .97,
    damping:.2,
    gain: .15,
    frequency:220,
    pan: .5,
    glide:1,
    panVoices:false,
    loudness:1,
    blend:1
  }

  let envCheckFactory = ( syn,synth ) => {
    let envCheck = ()=> {
      let phase = syn.getPhase(),
          endTime = synth.decay * sampleRate

      if( phase > endTime ) {
        synth.disconnectUgen( syn )
        syn.isConnected = false
        Gibberish.memory.heap[ syn.phase.memory.value.idx ] = 0 // trigger doesn't seem to reset for some reason
      }else{
        Gibberish.blockCallbacks.push( envCheck )
      }
    }
    return envCheck
  }

  const PolyKarplus = Gibberish.PolyTemplate( Karplus, ['frequency','decay','damping','pan','gain', 'glide'], envCheckFactory ) 
  PolyKarplus.defaults = Karplus.defaults

  return [ Karplus, PolyKarplus ]

}

},{"./instrument.js":37,"genish.js":103}],40:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Kick = inputProps => {
    // establish prototype chain
    const kick = Object.create( instrument )

    // define inputs
    const frequency = g.in( 'frequency' ),
          decay = g.in( 'decay' ),
          tone  = g.in( 'tone' ),
          gain  = g.in( 'gain' ),
          loudness = g.in( 'loudness' )
    
    // create initial property set
    const props = Object.assign( {}, Kick.defaults, inputProps )
    Object.assign( kick, props )

    // create DSP graph
    const trigger = g.bang(),
          impulse = g.mul( trigger, 60 ),
          scaledDecay = g.sub( 1.005, decay ), // -> range { .005, 1.005 }
          scaledTone = g.add( 50, g.mul( tone, g.mul(4000, loudness) ) ), // -> range { 50, 4050 }
          bpf = g.svf( impulse, frequency, scaledDecay, 2, false ),
          lpf = g.svf( bpf, scaledTone, .5, 0, false ),
          graph = g.mul( lpf, g.mul(gain, loudness) )
    
    kick.env = trigger
    const out = Gibberish.factory( kick, graph, ['instruments','kick'], props  )

    return out
  }
  
  Kick.defaults = {
    gain: 1,
    frequency:85,
    tone: .25,
    decay:.9,
    loudness:1
  }

  return Kick

}

},{"./instrument.js":37,"genish.js":103}],41:[function(require,module,exports){
const g = require('genish.js'),
      instrument = require('./instrument.js'),
      feedbackOsc = require('../oscillators/fmfeedbackosc.js');

module.exports = function (Gibberish) {

  const Mono = argumentProps => {
    const syn = Object.create(instrument),
          oscs = [],
          frequency = g.in('frequency'),
          glide = g.in('glide'),
          slidingFreq = g.memo(g.slide(frequency, glide, glide)),
          attack = g.in('attack'),
          decay = g.in('decay'),
          sustain = g.in('sustain'),
          sustainLevel = g.in('sustainLevel'),
          release = g.in('release'),
          loudness = g.in('loudness');

    const props = Object.assign({}, Mono.defaults, argumentProps);
    Object.assign(syn, props);

    syn.__createGraph = function () {
      const env = Gibberish.envelopes.factory(props.useADSR, props.shape, attack, decay, sustain, sustainLevel, release, props.triggerRelease);

      for (let i = 0; i < 3; i++) {
        let osc, freq;

        switch (i) {
          case 1:
            freq = g.add(slidingFreq, g.mul(slidingFreq, g.in('detune2')));
            break;
          case 2:
            freq = g.add(slidingFreq, g.mul(slidingFreq, g.in('detune3')));
            break;
          default:
            freq = slidingFreq;
        }

        osc = Gibberish.oscillators.factory(syn.waveform, freq, syn.antialias);

        oscs[i] = osc;
      }

      const oscSum = g.add(...oscs),
            oscWithEnv = g.mul(oscSum, env),
            baseCutoffFreq = g.mul(g.in('cutoff'), frequency),
            cutoff = g.mul(g.mul(baseCutoffFreq, g.pow(2, g.mul(g.in('filterMult'), loudness))), env),
            filteredOsc = Gibberish.filters.factory(oscWithEnv, cutoff, g.in('Q'), g.in('saturation'), syn);

      if (props.panVoices) {
        const panner = g.pan(filteredOsc, filteredOsc, g.in('pan'));
        syn.graph = [g.mul(panner.left, g.in('gain'), loudness), g.mul(panner.right, g.in('gain'), loudness)];
      } else {
        syn.graph = g.mul(filteredOsc, g.in('gain'), loudness);
      }

      syn.env = env;
    };

    syn.__requiresRecompilation = ['waveform', 'antialias', 'filterType', 'filterMode'];
    syn.__createGraph();

    const out = Gibberish.factory(syn, syn.graph, ['instruments', 'Monosynth'], props);

    return out;
  };

  Mono.defaults = {
    waveform: 'saw',
    attack: 44,
    decay: 22050,
    sustain: 44100,
    sustainLevel: .6,
    release: 22050,
    useADSR: false,
    shape: 'linear',
    triggerRelease: false,
    gain: .25,
    pulsewidth: .25,
    frequency: 220,
    pan: .5,
    detune2: .005,
    detune3: -.005,
    cutoff: 1,
    resonance: .25,
    Q: .5,
    panVoices: false,
    glide: 1,
    antialias: false,
    filterType: 1,
    filterMode: 0, // 0 = LP, 1 = HP, 2 = BP, 3 = Notch
    saturation: .5,
    filterMult: 4,
    isLowPass: true,
    loudness: 1
  };

  let PolyMono = Gibberish.PolyTemplate(Mono, ['frequency', 'attack', 'decay', 'cutoff', 'Q', 'detune2', 'detune3', 'pulsewidth', 'pan', 'gain', 'glide', 'saturation', 'filterMult', 'antialias', 'filterType', 'waveform', 'filterMode']);
  PolyMono.defaults = Mono.defaults;

  return [Mono, PolyMono];
};
},{"../oscillators/fmfeedbackosc.js":55,"./instrument.js":37,"genish.js":103}],42:[function(require,module,exports){
// XXX TOO MANY GLOBAL GIBBERISH VALUES

const Gibberish = require( '../index.js' )

module.exports = {
  note( freq, gain ) {
    // will be sent to processor node via proxy method...
    if( Gibberish.mode !== 'worklet' ) {
      let voice = this.__getVoice__()
      //Object.assign( voice, this.properties )
      if( gain === undefined ) gain = this.gain
      voice.gain = gain
      voice.note( freq )
      this.__runVoice__( voice, this )
      this.triggerNote = freq
    }
  },

  // XXX this is not particularly satisfying...
  // must check for both notes and chords
  trigger( gain ) {
    if( this.triggerChord !== null ) {
      this.triggerChord.forEach( v => {
        let voice = this.__getVoice__()
        Object.assign( voice, this.properties )
        voice.note( v )
        voice.gain = gain
        this.__runVoice__( voice, this )
      })
    }else if( this.triggerNote !== null ) {
      let voice = this.__getVoice__()
      Object.assign( voice, this.properties )
      voice.note( this.triggerNote )
      voice.gain = gain
      this.__runVoice__( voice, this )
    }else{
      let voice = this.__getVoice__()
      Object.assign( voice, this.properties )
      voice.trigger( gain )
      this.__runVoice__( voice, this )
    }
  },

  __runVoice__( voice, _poly ) {
    if( !voice.isConnected ) {
      voice.connect( _poly )
      voice.isConnected = true
    }

    let envCheck
    if( _poly.envCheck === undefined ) {
      envCheck = function() {
        if( voice.env.isComplete() ) {
          _poly.disconnectUgen( voice )
          voice.isConnected = false
        }else{
          Gibberish.blockCallbacks.push( envCheck )
        }
      }
    }else{
      envCheck = _poly.envCheck( voice, _poly )
    }

    // XXX uncomment this line to turn on dynamically connecting
    // disconnecting individual voices from graph
    //Gibberish.blockCallbacks.push( envCheck )
  },

  __getVoice__() {
    return this.voices[ this.voiceCount++ % this.voices.length ]
  },

  chord( frequencies ) {
    // will be sent to processor node via proxy method...
    if( Gibberish !== undefined && Gibberish.mode !== 'worklet' ) {
      frequencies.forEach( v => this.note( v ) )
      this.triggerChord = frequencies
    }
  },

  free() {
    for( let child of this.voices ) child.free()
  }
}

},{"../index.js":32}],43:[function(require,module,exports){
/*
 * This files creates a factory generating polysynth constructors.
 */

const g = require( 'genish.js' )
const __proxy = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )

  const TemplateFactory = ( ugen, propertyList, _envCheck ) => {
    /* 
     * polysynths are basically busses that connect child synth voices.
     * We create separate prototypes for mono vs stereo instances.
     */

    const monoProto   = Object.create( Gibberish.Bus() ),
          stereoProto = Object.create( Gibberish.Bus2() )

    // since there are two prototypes we can't assign directly to one of them...
    Object.assign( monoProto,   Gibberish.mixins.polyinstrument )
    Object.assign( stereoProto, Gibberish.mixins.polyinstrument )

    const Template = props => {
      const properties = Object.assign( {}, { isStereo:true, maxVoices:4 }, props )

      //const synth = properties.isStereo === true ? Object.create( stereoProto ) : Object.create( monoProto )
      const synth = properties.isStereo === true ? Gibberish.Bus2({ __useProxy__:false }) : Gibberish.Bus({ __useProxy__:false }) 

      Object.assign( 
        synth, 

        {
          voices: [],
          maxVoices: properties.maxVoices, 
          voiceCount: 0,
          envCheck: _envCheck,
          dirty: true,
          ugenName: 'poly' + ugen.name + '_' + synth.id + '_' + ( properties.isStereo ? 2 : 1 ),
          properties
        },

        Gibberish.mixins.polyinstrument
      )

      properties.panVoices = true//false//properties.isStereo
      synth.callback.ugenName = synth.ugenName

      const storedId = properties.id
      if( properties.id !== undefined ) delete properties.id 

      for( let i = 0; i < synth.maxVoices; i++ ) {
        properties.id = synth.id +'_'+i
        synth.voices[i] = ugen( properties )
        synth.voices[i].callback.ugenName = synth.voices[i].ugenName
        synth.voices[i].isConnected = false
      }

      let _propertyList 
      if( properties.isStereo === false ) {
        _propertyList = propertyList.slice( 0 )
        const idx =  _propertyList.indexOf( 'pan' )
        if( idx  > -1 ) _propertyList.splice( idx, 1 )
      }

      properties.id = storedId

      TemplateFactory.setupProperties( synth, ugen, properties.isStereo ? propertyList : _propertyList )

      return proxy( ['instruments', 'Poly'+ugen.name], properties, synth ) 
    }

    return Template
  }

  TemplateFactory.setupProperties = function( synth, ugen, props ) {
    for( let property of props ) {
      if( property === 'pan' || property === 'id' ) continue
      Object.defineProperty( synth, property, {
        get() {
          return synth.properties[ property ] || ugen.defaults[ property ]
        },
        set( v ) {
          synth.properties[ property ] = v
          for( let child of synth.voices ) {
            child[ property ] = v
          }
        }
      })
    }
  }

  return TemplateFactory

}

},{"../workletProxy.js":65,"genish.js":103}],44:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {
  let proto = Object.create( instrument )

  Object.assign( proto, {
    note( rate ) {
      this.rate = rate
      if( rate > 0 ) {
        this.__trigger()
      }else{
        this.__phase__.value = this.data.buffer.length - 1 
      }
    },
    trigger( volume ) {
      if( volume !== undefined ) this.gain = volume

      // if we're playing the sample forwards...
      if( Gibberish.memory.heap[ this.__rateStorage__.memory.values.idx ] > 0 ) {
        this.__trigger()
      }else{
        this.__phase__.value = this.data.buffer.length - 1 
      }
    },
  })

  const Sampler = inputProps => {
    const syn = Object.create( proto )

    const props = Object.assign( { onload:null }, Sampler.defaults, inputProps )

    syn.isStereo = props.isStereo !== undefined ? props.isStereo : false

    const start = g.in( 'start' ), end = g.in( 'end' ), 
          rate = g.in( 'rate' ), shouldLoop = g.in( 'loops' ),
          loudness = g.in( 'loudness' ),
          // rate storage is used to determine whether we're playing
          // the sample forward or in reverse, for use in the 'trigger' method.
          rateStorage = g.data([0], 1, { meta:true })

    Object.assign( syn, props )

    if( Gibberish.mode === 'worklet' ) {
      syn.__meta__ = {
        address:'add',
        name: ['instruments', 'Sampler'],
        properties: JSON.stringify(props), 
        id: syn.id
      }

      Gibberish.worklet.ugens.set( syn.id, syn )

      Gibberish.worklet.port.postMessage( syn.__meta__ )
    }

    syn.__createGraph = function() {
      syn.__bang__ = g.bang()
      syn.__trigger = syn.__bang__.trigger

      syn.__phase__ = g.counter( rate, start, end, syn.__bang__, shouldLoop, { shouldWrap:false, initialValue:9999999 })
      
      syn.__rateStorage__ = rateStorage
      rateStorage[0] = rate

      // XXX we added our recorded 'rate' param and then effectively substract it,
      // so that its presence in the graph will force genish to actually record the 
      // rate as the input. this is extremely hacky... there should be a way to record
      // value without having to include it in the graph!
      syn.graph = g.add( g.mul( 
        g.ifelse( 
          g.and( g.gte( syn.__phase__, start ), g.lt( syn.__phase__, end ) ),
          g.peek( 
            syn.data, 
            syn.__phase__,
            { mode:'samples' }
          ),
          0
        ), 
        g.mul( loudness, g.in('gain') )
      ), rateStorage[0], g.mul( rateStorage[0], -1 ) )
    }

    const onload = buffer => {
      if( Gibberish.mode === 'worklet' ) {
        const memIdx = Gibberish.memory.alloc( syn.data.memory.values.length, true )

        Gibberish.worklet.port.postMessage({
          address:'copy',
          id: syn.id,
          idx: memIdx,
          buffer: syn.data.buffer
        })

      }else if ( Gibberish.mode === 'processor' ) {
        syn.data.buffer = buffer
        syn.data.memory.values.length = syn.data.dim = buffer.length
        syn.__redoGraph() 
      }

      if( typeof syn.onload === 'function' ){  
        syn.onload( buffer || syn.data.buffer )
      }
      if( syn.end === -999999999 ) syn.end = syn.data.buffer.length - 1
    }

    //if( props.filename ) {
    syn.loadFile = function( filename ) {
      if( Gibberish.mode !== 'processor' ) { 
        syn.data = g.data( filename )
      }else{
        syn.data = g.data( new Float32Array() )
      }

      syn.data.onload = onload
    }

    syn.loadBuffer = function( buffer ) {
      if( Gibberish.mode === 'processor' ) {
        syn.data.buffer = buffer
        syn.data.memory.values.length = syn.data.dim = buffer.length
        syn.__redoGraph() 
      }
    }

    if( props.filename !== undefined ) {
      syn.loadFile( props.filename )
    }else{
      syn.data = g.data( new Float32Array() )
    }

    syn.data.onload = onload

    syn.__createGraph()
    
    const out = Gibberish.factory( 
      syn,
      syn.graph,
      ['instruments','sampler'], 
      props 
    ) 

    return out
  }

  Sampler.defaults = {
    gain: 1,
    pan: .5,
    rate: 1,
    panVoices:false,
    loops: 0,
    start:0,
    end:-999999999,
    loudness:1
  }

  const envCheckFactory = function( voice, _poly ) {

    const envCheck = () => {
      const phase = Gibberish.memory.heap[ voice.__phase__.memory.value.idx ]
      if( ( voice.rate > 0 && phase > voice.end ) || ( voice.rate < 0 && phase < 0 ) ) {
        _poly.disconnectUgen.call( _poly, voice )
        voice.isConnected = false
      }else{
        Gibberish.blockCallbacks.push( envCheck )
      }
    }

    return envCheck
  }

  const PolySampler = Gibberish.PolyTemplate( Sampler, ['rate','pan','gain','start','end','loops'], envCheckFactory ) 

  return [ Sampler, PolySampler ]
}


},{"./instrument.js":37,"genish.js":103}],45:[function(require,module,exports){
let g = require( 'genish.js' ),
    instrument = require( './instrument.js' )
  
module.exports = function( Gibberish ) {

  let Snare = argumentProps => {
    let snare = Object.create( instrument ),
        decay = g.in( 'decay' ),
        scaledDecay = g.mul( decay, g.gen.samplerate * 2 ),
        snappy= g.in( 'snappy' ),
        tune  = g.in( 'tune' ),
        gain  = g.in( 'gain' ),
        loudness = g.in( 'loudness' )

    let props = Object.assign( {}, Snare.defaults, argumentProps )

    let eg = g.decay( scaledDecay, { initValue:0 } ), 
        check = g.memo( g.gt( eg, .0005 ) ),
        rnd = g.mul( g.noise(), eg ),
        hpf = g.svf( rnd, g.add( 1000, g.mul( g.add( 1, tune), 1000 ) ), .5, 1, false ),
        snap = g.mul( g.gtp( g.mul( hpf, snappy ), 0 ), loudness ), // rectify
        bpf1 = g.svf( eg, g.mul( 180, g.add( tune, 1 ) ), .05, 2, false ),
        bpf2 = g.svf( eg, g.mul( 330, g.add( tune, 1 ) ), .05, 2, false ),
        out  = g.memo( g.add( snap, bpf1, g.mul( bpf2, .8 ) ) ), //XXX why is memo needed?
        scaledOut = g.mul( out, g.mul( gain, loudness ) )
    
    // XXX TODO : make this work with ifelse. the problem is that poke ugens put their
    // code at the bottom of the callback function, instead of at the end of the
    // associated if/else block.
    let ife = g.switch( check, scaledOut, 0 )
    //let ife = g.ifelse( g.gt( eg, .005 ), cycle(440), 0 )
    
    snare.env = eg 
    snare = Gibberish.factory( snare, ife, ['instruments','snare'], props  )
    
    return snare
  }
  
  Snare.defaults = {
    gain: .5,
    frequency:1000,
    tune:0,
    snappy: 1,
    decay:.1,
    loudness:1
  }

  return Snare

}

},{"./instrument.js":37,"genish.js":103}],46:[function(require,module,exports){
const g = require('genish.js'),
      instrument = require('./instrument.js');

const genish = g;

module.exports = function (Gibberish) {

  const Synth = inputProps => {
    const syn = Object.create(instrument);

    const frequency = g.in('frequency'),
          loudness = g.in('loudness'),
          glide = g.in('glide'),
          slidingFreq = g.slide(frequency, glide, glide),
          attack = g.in('attack'),
          decay = g.in('decay'),
          sustain = g.in('sustain'),
          sustainLevel = g.in('sustainLevel'),
          release = g.in('release');

    const props = Object.assign({}, Synth.defaults, inputProps);
    Object.assign(syn, props);

    syn.__createGraph = function () {
      const osc = Gibberish.oscillators.factory(syn.waveform, slidingFreq, syn.antialias);

      const env = Gibberish.envelopes.factory(props.useADSR, props.shape, attack, decay, sustain, sustainLevel, release, props.triggerRelease);

      // below doesn't work as it attempts to assign to release property triggering codegen...
      // syn.release = ()=> { syn.env.release() }

      {
        'use jsdsp';
        let oscWithEnv = genish.mul(genish.mul(osc, env), loudness),
            panner;

        const baseCutoffFreq = genish.mul(g.in('cutoff'), frequency);
        const cutoff = genish.mul(genish.mul(baseCutoffFreq, g.pow(2, genish.mul(g.in('filterMult'), loudness))), env);
        const filteredOsc = Gibberish.filters.factory(oscWithEnv, cutoff, g.in('Q'), g.in('saturation'), props);

        let synthWithGain = genish.mul(filteredOsc, g.in('gain'));

        if (genish.eq(syn.panVoices, true)) {
          panner = g.pan(synthWithGain, synthWithGain, g.in('pan'));
          syn.graph = [panner.left, panner.right];
        } else {
          syn.graph = synthWithGain;
        }

        syn.env = env;
        syn.osc = osc;
        syn.filter = filteredOsc;
      }
    };

    syn.__requiresRecompilation = ['waveform', 'antialias', 'filterType', 'filterMode', 'useADSR', 'shape'];
    syn.__createGraph();

    const out = Gibberish.factory(syn, syn.graph, ['instruments', 'synth'], props);

    return out;
  };

  Synth.defaults = {
    waveform: 'saw',
    attack: 44,
    decay: 22050,
    sustain: 44100,
    sustainLevel: .6,
    release: 22050,
    useADSR: false,
    shape: 'linear',
    triggerRelease: false,
    gain: .5,
    pulsewidth: .25,
    frequency: 220,
    pan: .5,
    antialias: false,
    panVoices: false,
    loudness: 1,
    glide: 1,
    saturation: 1,
    filterMult: 2,
    Q: .25,
    cutoff: .5,
    filterType: 0,
    filterMode: 0,
    isLowPass: 1
  };

  // do not include velocity, which shoudl always be per voice
  let PolySynth = Gibberish.PolyTemplate(Synth, ['frequency', 'attack', 'decay', 'pulsewidth', 'pan', 'gain', 'glide', 'saturation', 'filterMult', 'Q', 'cutoff', 'resonance', 'antialias', 'filterType', 'waveform', 'filterMode']);
  PolySynth.defaults = Synth.defaults;

  return [Synth, PolySynth];
};
},{"./instrument.js":37,"genish.js":103}],47:[function(require,module,exports){
const g = require( 'genish.js' ),
      instrument = require( './instrument.js' )

module.exports = function( Gibberish ) {

  const Tom = argumentProps => {
    let tom = Object.create( instrument )
    
    const decay   = g.in( 'decay' ),
          pitch   = g.in( 'frequency' ),
          gain    = g.in( 'gain' ),
          loudness = g.in( 'loudness' )

    const props = Object.assign( {}, Tom.defaults, argumentProps )

    const trigger = g.bang(),
          impulse = g.mul( trigger, 1 ),
          eg = g.decay( g.mul( decay, g.gen.samplerate * 2 ), { initValue:0 } ), 
          bpf = g.mul( g.svf( impulse, pitch, .0175, 2, false ), 10 ),
          noise = g.gtp( g.noise(), 0 ), // rectify noise
          envelopedNoise = g.mul( noise, eg ),
          lpf = g.mul( g.svf( envelopedNoise, 120, .5, 0, false ), 2.5 ),
          out = g.mul( g.add( bpf, lpf ), g.mul( gain, loudness ) )

    tom.env = {
      trigger: function() {
        eg.trigger()
        trigger.trigger()
      }
    }

    tom.isStereo = false

    tom = Gibberish.factory( tom, out, ['instruments', 'tom'], props  )
    
    return tom
  }
  
  Tom.defaults = {
    gain: 1,
    decay:.7,
    frequency:120,
    loudness:1
  }

  return Tom
}

},{"./instrument.js":37,"genish.js":103}],48:[function(require,module,exports){
const ugenproto = require( '../ugen.js' )()
const __proxy     = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )

  let Binops = {
    export( obj ) {
      for( let key in Binops ) {
        if( key !== 'export' ) {
          obj[ key ] = Binops[ key ]
        }
      }
    },
    
    Add( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      Object.assign( ugen, { isop:true, op:'+', inputs:args, ugenName:'add' + id, id } )

      return proxy( ['binops','Add'], { isop:true, inputs:args }, ugen )
    },

    Sub( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      Object.assign( ugen, { isop:true, op:'-', inputs:args, ugenName:'sub' + id, id } )

      return proxy( ['binops','Sub'], { isop:true, inputs:args }, ugen )
    },

    Mul( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      Object.assign( ugen, { isop:true, op:'*', inputs:args, ugenName:'mul' + id, id } )

      return proxy( ['binops','Mul'], { isop:true, inputs:args }, ugen )
    },

    Div( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      Object.assign( ugen, { isop:true, op:'/', inputs:args, ugenName:'div' + id, id } )
    
      return proxy( ['binops','Div'], { isop:true, inputs:args }, ugen )
    },

    Mod( ...args ) {
      const id = Gibberish.factory.getUID()
      const ugen = Object.create( ugenproto )
      Object.assign( ugen, { isop:true, op:'%', inputs:args, ugenName:'mod' + id, id } )

      return proxy( ['binops','Mod'], { isop:true, inputs:args }, ugen )
    },   
  }

  return Binops
}

},{"../ugen.js":62,"../workletProxy.js":65}],49:[function(require,module,exports){
let g = require( 'genish.js' ),
    ugen = require( '../ugen.js' )(),
    __proxy= require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )
  const Bus = Object.create( ugen )

  Object.assign( Bus, {
    gain: {
      set( v ) {
        this.mul.inputs[ 1 ] = v
        Gibberish.dirty( this )
      },
      get() {
        return this.mul[ 1 ]
      }
    },

    __addInput( input ) {
      this.sum.inputs.push( input )
      Gibberish.dirty( this )
    },

    create( _props ) {
      const props = Object.assign({}, Bus.defaults, { inputs:[0] }, _props )

      const sum = Gibberish.binops.Add( ...props.inputs )
      const mul = Gibberish.binops.Mul( sum, props.gain )

      const graph = Gibberish.Panner({ input:mul, pan: props.pan })

      graph.sum = sum
      graph.mul = mul
      graph.disconnectUgen = Bus.disconnectUgen

      graph.__properties__ = props

      const out = props.__useProxy__ === true ? proxy( ['Bus'], props, graph ) : graph

      Object.defineProperty( out, 'gain', Bus.gain )

      if( false && Gibberish.preventProxy === false && Gibberish.mode === 'worklet' ) {
        const meta = {
          address:'add',
          name:['Bus'],
          props, 
          id:graph.id
        }
        Gibberish.worklet.port.postMessage( meta )
        Gibberish.worklet.port.postMessage({ 
          address:'method', 
          object:graph.id,
          name:'connect',
          args:[]
        })
      }

      return out 
    },

    disconnectUgen( ugen ) {
      let removeIdx = this.sum.inputs.indexOf( ugen )

      if( removeIdx !== -1 ) {
        this.sum.inputs.splice( removeIdx, 1 )
        Gibberish.dirty( this )
      }
    },

    // can't include inputs here as it will be sucked up by Gibber,
    // instead pass during Object.assign() after defaults.
    defaults: { gain:1, pan:.5, __useProxy__:true }
  })

  const constructor = Bus.create.bind( Bus )
  constructor.defaults = Bus.defaults

  return constructor
}


},{"../ugen.js":62,"../workletProxy.js":65,"genish.js":103}],50:[function(require,module,exports){
const g = require( 'genish.js' ),
      ugen = require( '../ugen.js' )(),
      __proxy = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {
  const Bus2 = Object.create( ugen )
  const proxy = __proxy( Gibberish )

  let bufferL, bufferR
  
  Object.assign( Bus2, { 
    create( __props ) {

      if( bufferL === undefined ) {
        bufferL = Gibberish.genish.gen.globals.panL.memory.values.idx
        bufferR = Gibberish.genish.gen.globals.panR.memory.values.idx
      }

      // XXX must be same type as what is returned by genish for type checks to work correctly
      const output = new Float64Array( 2 ) 

      const bus = Object.create( Bus2 )

      let init = false

      const props = Object.assign({}, Bus2.defaults, __props )

      Object.assign( 
        bus,

        {
          callback() {
            output[ 0 ] = output[ 1 ] = 0
            const lastIdx = arguments.length - 1
            const memory  = arguments[ lastIdx ]
            const pan  = arguments[ lastIdx - 1 ]
            const gain = arguments[ lastIdx - 2 ]

            for( let i = 0; i < lastIdx - 2; i+= 3 ) {
              const input = arguments[ i ],
                    level = arguments[ i + 1 ],
                    isStereo = arguments[ i + 2 ]

              output[ 0 ] += isStereo === true ? input[ 0 ] * level : input * level

              output[ 1 ] += isStereo === true ? input[ 1 ] * level : input * level
            }

            const panRawIndex  = pan * 1023,
                  panBaseIndex = panRawIndex | 0,
                  panNextIndex = (panBaseIndex + 1) & 1023,
                  interpAmount = panRawIndex - panBaseIndex,
                  panL = memory[ bufferL + panBaseIndex ] 
                    + ( interpAmount * ( memory[ bufferL + panNextIndex ] - memory[ bufferL + panBaseIndex ] ) ),
                  panR = memory[ bufferR + panBaseIndex ] 
                    + ( interpAmount * ( memory[ bufferR + panNextIndex ] - memory[ bufferR + panBaseIndex ] ) )
            
            output[0] *= gain * panL
            output[1] *= gain * panR

            return output
          },
          id : Gibberish.factory.getUID(),
          dirty : false,
          type : 'bus',
          inputs:[ 1, .5 ],
          isStereo: true,
          __properties__:props
        },

        Bus2.defaults,

        props
      )

      bus.ugenName = bus.callback.ugenName = 'bus2_' + bus.id

      const out = bus.__useProxy__ === true ? proxy( ['Bus2'], props, bus ) : bus


      // we have to include custom properties for these as the argument list for
      // the compiled output function is variable
      // so codegen can't know the correct argument order for the function
      let pan = .5
      Object.defineProperty( out, 'pan', {
        get() { return pan },
        set(v){ 
          pan = v
          out.inputs[ out.inputs.length - 1 ] = pan
          Gibberish.dirty( out )
        }
      })

      let gain = 1
      Object.defineProperty( out, 'gain', {
        get() { return gain },
        set(v){ 
          gain = v
          out.inputs[ out.inputs.length - 2 ] = gain
          Gibberish.dirty( out )
        }
      })

      return out
    },
    
    disconnectUgen( ugen ) {
      let removeIdx = this.inputs.indexOf( ugen )

      if( removeIdx !== -1 ) {
        this.inputs.splice( removeIdx, 3 )
        Gibberish.dirty( this )
      }
    },

    defaults: { gain:1, pan:.5, __useProxy__:true }
  })

  const constructor = Bus2.create.bind( Bus2 )
  constructor.defaults = Bus2.defaults

  return constructor

}

},{"../ugen.js":62,"../workletProxy.js":65,"genish.js":103}],51:[function(require,module,exports){
const  g    = require( 'genish.js'  ),
       ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {

  const Monops = {
    export( obj ) {
      for( let key in Monops ) {
        if( key !== 'export' ) {
          obj[ key ] = Monops[ key ]
        }
      }
    },
    
    Abs( input ) {
      const abs = Object.create( ugen )
      const graph = g.abs( g.in('input') )
      
      const __out = Gibberish.factory( abs, graph, ['monops','abs'], Object.assign({}, Monops.defaults, { inputs:[input], isop:true }) )

      return __out
    },

    Pow( input, exponent ) {
      const pow = Object.create( ugen )
      const graph = g.pow( g.in('input'), g.in('exponent') )
      
      Gibberish.factory( pow, graph, ['monops','pow'], Object.assign({}, Monops.defaults, { inputs:[input], exponent, isop:true }) )

      return pow
    },
    Clamp( input, min, max ) {
      const clamp = Object.create( ugen )
      const graph = g.clamp( g.in('input'), g.in('min'), g.in('max') )
      
      const __out = Gibberish.factory( clamp, graph, ['monops','clamp'], Object.assign({}, Monops.defaults, { inputs:[input], isop:true, min, max }) )

      return __out
    },

    Merge( input ) {
      const merger = Object.create( ugen )
      const cb = function( _input ) {
        return _input[0] + _input[1]
      }

      Gibberish.factory( merger, g.in( 'input' ), ['monops','merge'], { inputs:[input], isop:true }, cb )
      merger.type = 'analysis'
      merger.inputNames = [ 'input' ]
      merger.inputs = [ input ]
      merger.input = input
      
      return merger
    },
  }

  Monops.defaults = { input:0 }

  return Monops
}

},{"../ugen.js":62,"genish.js":103}],52:[function(require,module,exports){
const g = require( 'genish.js' )

const ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {
 
let Panner = inputProps => {
  const props  = Object.assign( {}, Panner.defaults, inputProps ),
        panner = Object.create( ugen )

  const isStereo = props.input.isStereo !== undefined ? props.input.isStereo : Array.isArray( props.input ) 
  
  const input = g.in( 'input' ),
        pan   = g.in( 'pan' )

  let graph 
  if( isStereo ) {
    graph = g.pan( input[0], input[1], pan )  
  }else{
    graph = g.pan( input, input, pan )
  }

  Gibberish.factory( panner, [ graph.left, graph.right], ['panner'], props )
  
  return panner
}

Panner.defaults = {
  input:0,
  pan:.5
}

return Panner 

}

},{"../ugen.js":62,"genish.js":103}],53:[function(require,module,exports){
module.exports = function( Gibberish ) {

  const Time = {
    bpm: 120,

    export: function(target) {
      Object.assign( target, Time )
    },

    ms : function(val) {
      return val * Gibberish.ctx.sampleRate / 1000;
    },

    seconds : function(val) {
      return val * Gibberish.ctx.sampleRate;
    },

    beats : function(val) {
      return function() { 
        var samplesPerBeat = Gibberish.ctx.sampleRate / ( Gibberish.Time.bpm / 60 ) ;
        return samplesPerBeat * val ;
      }
    }
  }

  return Time
}

},{}],54:[function(require,module,exports){
const genish = require('genish.js'),
      ssd = genish.history,
      noise = genish.noise;

module.exports = function () {
  "use jsdsp";

  const last = ssd(0);

  const white = genish.sub(genish.mul(noise(), 2), 1);

  let out = genish.add(last.out, genish.div(genish.mul(.02, white), 1.02));

  last.in(out);

  out = genish.mul(out, 3.5);

  return out;
};
},{"genish.js":103}],55:[function(require,module,exports){
let g = require( 'genish.js' )

let feedbackOsc = function( frequency, filter, pulsewidth=.5, argumentProps ) {
  if( argumentProps === undefined ) argumentProps = { type: 0 }

  let lastSample = g.history(),
      // determine phase increment and memoize result
      w = g.memo( g.div( frequency, g.gen.samplerate ) ),
      // create scaling factor
      n = g.sub( -.5, w ),
      scaling = g.mul( g.mul( 13, filter ), g.pow( n, 5 ) ),
      // calculate dc offset and normalization factors
      DC = g.sub( .376, g.mul( w, .752 ) ),
      norm = g.sub( 1, g.mul( 2, w ) ),
      // determine phase
      osc1Phase = g.accum( w, 0, { min:-1 }),
      osc1, out

  // create current sample... from the paper:
  // osc = (osc + sin(2*pi*(phase + osc*scaling)))*0.5f;
  osc1 = g.memo( 
    g.mul(
      g.add(
        lastSample.out,
        g.sin(
          g.mul(
            Math.PI * 2,
            g.memo( g.add( osc1Phase, g.mul( lastSample.out, scaling ) ) )
          )
        )
      ),
      .5
    )
  )

  // store sample to use as modulation
  lastSample.in( osc1 )

  // if pwm / square waveform instead of sawtooth...
  if( argumentProps.type === 1 ) { 
    const lastSample2 = g.history() // for osc 2
    const lastSampleMaster = g.history() // for sum of osc1,osc2

    const osc2 = g.mul(
      g.add(
        lastSample2.out,
        g.sin(
          g.mul(
            Math.PI * 2,
            g.memo( g.add( osc1Phase, g.mul( lastSample2.out, scaling ), pulsewidth ) )
          )
        )
      ),
      .5
    )

    lastSample2.in( osc2 )
    out = g.memo( g.sub( lastSample.out, lastSample2.out ) )
    out = g.memo( g.add( g.mul( 2.5, out ), g.mul( -1.5, lastSampleMaster.out ) ) )
    
    lastSampleMaster.in( g.sub( osc1, osc2 ) )

  }else{
     // offset and normalize
    osc1 = g.add( g.mul( 2.5, osc1 ), g.mul( -1.5, lastSample.out ) )
    osc1 = g.add( osc1, DC )
 
    out = osc1
  }

  return g.mul( out, norm )
}

module.exports = feedbackOsc

},{"genish.js":103}],56:[function(require,module,exports){
const g = require( 'genish.js' ),
      ugen = require( '../ugen.js' )(),
      feedbackOsc = require( './fmfeedbackosc.js' )

//  __makeOscillator__( type, frequency, antialias ) {
    
module.exports = function( Gibberish ) {
  let Oscillators = {
    export( obj ) {
      for( let key in Oscillators ) {
        if( key !== 'export' ) {
          obj[ key ] = Oscillators[ key ]
        }
      }
    },

    genish: {
      Brown: require( './brownnoise.js' ),
      Pink:  require( './pinknoise.js'  )
    },

    Wavetable: require( './wavetable.js' )( Gibberish ),
    
    Square( inputProps ) {
      const sqr   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'square', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( sqr, graph, ['oscillators','square'], props )

      return out
    },

    Triangle( inputProps ) {
      const tri= Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'triangle', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out =Gibberish.factory( tri, graph, ['oscillators','triangle'], props )

      return out
    },

    PWM( inputProps ) {
      const pwm   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false, pulsewidth:.25 }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'pwm', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( pwm, graph, ['oscillators','PWM'], props )

      return out
    },

    Sine( inputProps ) {
      const sine  = Object.create( ugen )
      const props = Object.assign({}, Oscillators.defaults, inputProps )
      const graph = g.mul( g.cycle( g.in('frequency') ), g.in('gain') )

      const out = Gibberish.factory( sine, graph, ['oscillators','sine'], props )
      
      return out
    },

    Noise( inputProps ) {
      const noise = Object.create( ugen )
      const props = Object.assign( {}, { gain: 1, color:'white' }, inputProps )
      let graph 

      switch( props.color ) {
        case 'brown':
          graph = g.mul( Oscillators.genish.Brown(), g.in('gain') )
          break;
        case 'pink':
          graph = g.mul( Oscillators.genish.Pink(), g.in('gain') )
          break;
        default:
          graph = g.mul( g.noise(), g.in('gain') )
          break;
      }

      const out = Gibberish.factory( noise, graph, ['oscillators','noise'], props )

      return out
    },

    Saw( inputProps ) {
      const saw   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = Oscillators.factory( 'saw', g.in( 'frequency' ), props.antialias )
      const graph = g.mul( osc, g.in('gain' ) )

      const out = Gibberish.factory( saw, graph, ['oscillators','saw'], props )

      return out
    },

    ReverseSaw( inputProps ) {
      const saw   = Object.create( ugen ) 
      const props = Object.assign({ antialias:false }, Oscillators.defaults, inputProps )
      const osc   = g.sub( 1, Oscillators.factory( 'saw', g.in( 'frequency' ), props.antialias ) )
      const graph = g.mul( osc, g.in( 'gain' ) )

      const out = Gibberish.factory( saw, graph, ['oscillators','ReverseSaw'], props )
      
      return out
    },

    factory( type, frequency, antialias=false ) {
      let osc

      switch( type ) {
        case 'pwm':
          let pulsewidth = g.in('pulsewidth')
          if( antialias === true ) {
            osc = feedbackOsc( frequency, 1, pulsewidth, { type:1 })
          }else{
            let phase = g.phasor( frequency, 0, { min:0 } )
            osc = g.lt( phase, pulsewidth )
          }
          break;
        case 'saw':
          if( antialias === false ) {
            osc = g.phasor( frequency )
          }else{
            osc = feedbackOsc( frequency, 1 )
          }
          break;
        case 'sine':
          osc = g.cycle( frequency )
          break;
        case 'square':
          if( antialias === true ) {
            osc = feedbackOsc( frequency, 1, .5, { type:1 })
          }else{
            osc = g.wavetable( frequency, { buffer:Oscillators.Square.buffer, name:'square' } )
          }
          break;
        case 'triangle':
          osc = g.wavetable( frequency, { buffer:Oscillators.Triangle.buffer, name:'triangle' } )
          break;
      }

      return osc
    }
  }

  Oscillators.Square.buffer = new Float32Array( 1024 )

  for( let i = 1023; i >= 0; i-- ) { 
    Oscillators.Square.buffer [ i ] = i / 1024 > .5 ? 1 : -1
  }

  Oscillators.Triangle.buffer = new Float32Array( 1024 )

  
  for( let i = 1024; i--; i = i ) { Oscillators.Triangle.buffer[i] = 1 - 4 * Math.abs(( (i / 1024) + 0.25) % 1 - 0.5); }

  Oscillators.defaults = {
    frequency: 440,
    gain: 1
  }

  return Oscillators

}

},{"../ugen.js":62,"./brownnoise.js":54,"./fmfeedbackosc.js":55,"./pinknoise.js":57,"./wavetable.js":58,"genish.js":103}],57:[function(require,module,exports){
const genish = require('genish.js'),
      ssd = genish.history,
      data = genish.data,
      noise = genish.noise;

module.exports = function () {
  "use jsdsp";

  const b = data(8, 1, { meta: true });
  const white = genish.sub(genish.mul(noise(), 2), 1);

  b[0] = genish.add(genish.mul(.99886, b[0]), genish.mul(white, .0555179));
  b[1] = genish.add(genish.mul(.99332, b[1]), genish.mul(white, .0750579));
  b[2] = genish.add(genish.mul(.96900, b[2]), genish.mul(white, .1538520));
  b[3] = genish.add(genish.mul(.88650, b[3]), genish.mul(white, .3104856));
  b[4] = genish.add(genish.mul(.55000, b[4]), genish.mul(white, .5329522));
  b[5] = genish.sub(genish.mul(-.7616, b[5]), genish.mul(white, .0168980));

  const out = genish.mul(genish.add(genish.add(genish.add(genish.add(genish.add(genish.add(genish.add(b[0], b[1]), b[2]), b[3]), b[4]), b[5]), b[6]), genish.mul(white, .5362)), .11);

  b[6] = genish.mul(white, .115926);

  return out;
};
},{"genish.js":103}],58:[function(require,module,exports){
let g = require( 'genish.js' ),
    ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {

  const Wavetable = function( inputProps ) {
    const wavetable = Object.create( ugen )
    const props  = Object.assign({}, Gibberish.oscillators.defaults, inputProps )
    const osc = g.wavetable( g.in('frequency'), props )
    const graph = g.mul( 
      osc, 
      g.in( 'gain' )
    )

    Gibberish.factory( wavetable, graph, 'wavetable', props )

    return wavetable
  }

  g.wavetable = function( frequency, props ) {
    let dataProps = { immutable:true }

    // use global references if applicable
    if( props.name !== undefined ) dataProps.global = props.name

    const buffer = g.data( props.buffer, 1, dataProps )

    return g.peek( buffer, g.phasor( frequency, 0, { min:0 } ) )
  }

  return Wavetable
}

},{"../ugen.js":62,"genish.js":103}],59:[function(require,module,exports){
const Queue = require( '../external/priorityqueue.js' )
const Big   = require( 'big.js' )

let Scheduler = {
  phase: 0,

  queue: new Queue( ( a, b ) => {
    if( a.time === b.time ) { //a.time.eq( b.time ) ) {
      return a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0;
//b.priority - a.priority 

    }else{
      return a.time - b.time //a.time.minus( b.time )
    }
  }),

  clear() {
    this.queue.data.length = 0
    this.queue.length = 0
  },

  add( time, func, priority = 0 ) {
    time += this.phase

    this.queue.push({ time, func, priority })
  },

  tick() {
    if( this.queue.length ) {
      let next = this.queue.peek()

      if( isNaN( next.time ) ) {
        this.queue.pop()
      }
      
      while( this.phase >= next.time ) {
        next.func( next.priority )
        this.queue.pop()
        next = this.queue.peek()

        // XXX this happens when calling sequencer.stop()... why?
        if( next === undefined ) break
      }
    }

    this.phase++
  },
}

module.exports = Scheduler

},{"../external/priorityqueue.js":9,"big.js":66}],60:[function(require,module,exports){
const g = require( 'genish.js' ),
      __proxy = require( '../workletProxy.js' ),
      ugen = require( '../ugen.js' )()

module.exports = function( Gibberish ) {
  const __proto__ = Object.create( ugen )

  const proxy = __proxy( Gibberish )

  Object.assign( __proto__, {
    start( delay=0 ) {
      if( delay !== 0 ) {
        Gibberish.scheduler.add( delay, ()=> {
          Gibberish.analyzers.push( this )
          Gibberish.dirty( Gibberish.analyzers )
        })
      }else{
        Gibberish.analyzers.push( this )
        Gibberish.dirty( Gibberish.analyzers )
      }
      return this
    },
    stop() {
      const idx = Gibberish.analyzers.indexOf( this )
      Gibberish.analyzers.splice( idx, 1 )
      Gibberish.dirty( Gibberish.analyzers )
      return this
    }
  })

  // XXX we need to implement priority, which will in turn determine the order
  // that the sequencers are added to the callback function.
  const Seq2 = { 
    create( inputProps ) {
      const seq = Object.create( __proto__ ),
            properties = Object.assign({}, Seq2.defaults, inputProps )

      seq.phase = 0
      seq.inputNames = [ 'rate' ]
      seq.inputs = [ 1 ]
      seq.nextTime = 0
      seq.__valuesPhase = 0
      seq.__timingsPhase = 0
      seq.id = Gibberish.factory.getUID()
      seq.dirty = true
      seq.type = 'seq'
      seq.__addresses__ = {}

      properties.id = Gibberish.factory.getUID()

      Object.assign( seq, properties ) 
      seq.__properties__ = properties

      
      // XXX this needs to be optimized as much as humanly possible, since it's running at audio rate...
      seq.callback = function( rate ) {
        if( seq.phase >= seq.nextTime ) {
          let value  = typeof seq.values  === 'function' ? seq.values  : seq.values[ seq.__valuesPhase++  % seq.values.length  ],
          timing = typeof seq.timings === 'function' ? seq.timings : seq.timings[ seq.__timingsPhase++ % seq.timings.length ],
          shouldRun = true

          if( typeof timing === 'function' ) timing = timing()

          // XXX this supports an edge case in Gibber, where patterns like Euclid / Hex return
          // objects indicating both whether or not they should should trigger values as well
          // as the next time they should run. perhaps this could be made more generalizable?
          if( typeof timing === 'object' ) {
            if( timing.shouldExecute === 1 ) {
              shouldRun = true
            }else{
              shouldRun = false
            }
            timing = timing.time 
          }

          if( shouldRun ) {
            if( typeof value === 'function' && seq.target === undefined ) {
              value()
            }else if( typeof seq.target[ seq.key ] === 'function' ) {
              if( typeof value === 'function' ) {
                value = value()
              }
              seq.target[ seq.key ]( value )
            }else{
              if( typeof value === 'function' ) value = value()
              seq.target[ seq.key ] = value
            }
          }

          seq.phase -= seq.nextTime
          seq.nextTime = timing
        }

        seq.phase += rate

        return 0
      }

      seq.ugenName = seq.callback.ugenName = 'seq_' + seq.id

      // since we're not passing our sequencer through the ugen template, we need
      // to grab a memory address for its rate so it can be sequenced and define
      // a property that manipulates that memory address.
      const idx = Gibberish.memory.alloc( 1 )
      Gibberish.memory.heap[ idx ] = seq.rate
      seq.__addresses__.rate = idx

      let value = seq.rate
      Object.defineProperty( seq, 'rate', {
        get() { return value },
        set( v ) {
          if( value !== v ) {
            if( typeof v === 'number' ) Gibberish.memory.heap[ idx ] = v

            Gibberish.dirty( Gibberish.analyzers )
            value = v
          }
        }
      })

      return proxy( ['Sequencer2'], properties, seq ) 
    }
  }

  Seq2.defaults = { rate: 1, priority:0 }

  return Seq2.create

}


},{"../ugen.js":62,"../workletProxy.js":65,"genish.js":103}],61:[function(require,module,exports){
const __proxy = require( '../workletProxy.js' )

module.exports = function( Gibberish ) {

const proxy = __proxy( Gibberish )

const Sequencer = props => {
  let __seq
  const seq = {
    __isRunning:false,

    __valuesPhase:  0,
    __timingsPhase: 0,
    __type:'seq',

    tick( priority ) {
      let value  = typeof seq.values  === 'function' ? seq.values  : seq.values[  seq.__valuesPhase++  % seq.values.length  ],
          timing = typeof seq.timings === 'function' ? seq.timings : seq.timings[ seq.__timingsPhase++ % seq.timings.length ],
          shouldRun = true

      if( typeof timing === 'function' ) timing = timing()

      // XXX this supports an edge case in Gibber, where patterns like Euclid / Hex return
      // objects indicating both whether or not they should should trigger values as well
      // as the next time they should run. perhaps this could be made more generalizable?
      if( typeof timing === 'object' ) {
        if( timing.shouldExecute === 1 ) {
          shouldRun = true
        }else{
          shouldRun = false
        }
        timing = timing.time 
      }

      timing *= seq.rate

      if( shouldRun ) {
        if( typeof value === 'function' && seq.target === undefined ) {
          value()
        }else if( typeof seq.target[ seq.key ] === 'function' ) {
          if( typeof value === 'function' ) value = value()
          seq.target[ seq.key ]( value )
        }else{
          if( typeof value === 'function' ) value = value()
          seq.target[ seq.key ] = value
        }
      }
      
      if( Gibberish.mode === 'processor' ) {
        if( seq.__isRunning === true && !isNaN( timing ) ) {
          Gibberish.scheduler.add( timing, seq.tick, seq.priority )
        }
      }
    },

    start( delay = 0 ) {
      seq.__isRunning = true
      Gibberish.scheduler.add( delay, seq.tick, seq.priority )
      return __seq
    },

    stop() {
      seq.__isRunning = false
      return __seq
    }
  }

  props.id = Gibberish.factory.getUID()

  // need a separate reference to the properties for worklet meta-programming
  const properties = Object.assign( {}, Sequencer.defaults, props )
  Object.assign( seq, properties ) 
  seq.__properties__ = properties

  __seq =  proxy( ['Sequencer'], properties, seq )

  return __seq
}

Sequencer.defaults = { priority:100000, values:[], timings:[], rate:1 }

Sequencer.make = function( values, timings, target, key, priority ) {
  return Sequencer({ values, timings, target, key, priority })
}

return Sequencer

}

},{"../workletProxy.js":65}],62:[function(require,module,exports){
let Gibberish = null

const __ugen = function( __Gibberish ) {
  if( __Gibberish !== undefined && Gibberish == null ) Gibberish = __Gibberish
 
  const replace = obj => {
    if( typeof obj === 'object' ) {
      if( obj.id !== undefined ) {
        return processor.ugens.get( obj.id )
      } 
    }

    return obj
  }

  const ugen = {
    __Gibberish:Gibberish,

    free:function() {
      Gibberish.genish.gen.free( this.graph )
    },

    print:function() {
      console.log( this.callback.toString() )
    },

    connect:function( target, level=1 ) {
      if( this.connected === undefined ) this.connected = []

      //let input = level === 1 ? this : Gibberish.binops.Mul( this, level )
      let input = this

      if( target === undefined || target === null ) target = Gibberish.output 


      // XXX I forgot, where is __addInput found? Can we control the
      // level of the input?
      if( typeof target.__addInput == 'function' ) {
        target.__addInput( input )
      } else if( target.sum && target.sum.inputs ) {
        target.sum.inputs.push( input )
      } else if( target.inputs ) {
        const idx = target.inputs.indexOf( input )

        // if no connection exists...
        if( idx === -1 ) {
          target.inputs.unshift( input, level, input.isStereo )
        }else{
          // ... otherwise update the connection's level, which is stored
          // one index higher in the input list.
          target.inputs[ idx + 1 ] = level
        }
      } else {
        target.input = input
        target.inputGain = level
      }

      Gibberish.dirty( target )

      this.connected.push([ target, input, level ])
      
      return this
    },

    disconnect:function( target ) {
      if( target === undefined ){
        if( Array.isArray( this.connected ) ) {
          for( let connection of this.connected ) {
            if( connection[0].disconnectUgen !== undefined ) {
              connection[0].disconnectUgen( connection[1] )
            }else if( connection[0].input === this ) {
              connection[0].input = 0
            }
          }
          this.connected.length = 0
        }
      }else{
        const connection = this.connected.find( v => v[0] === target )
        // if target is a bus...
        if( target.disconnectUgen !== undefined ) {
          if( connection !== undefined ) {
            target.disconnectUgen( connection[1] )
          }
        }else{
          // must be an effect, set input to 0
          target.input = 0
        }

        const targetIdx = this.connected.indexOf( connection )

        if( targetIdx !== -1 ) {
          this.connected.splice( targetIdx, 1 )
        }
      }
    },

    chain:function( target, level=1 ) {
      this.connect( target,level )

      return target
    },

    __redoGraph:function() {
      let isStereo = this.isStereo
      this.__createGraph()
      this.callback = Gibberish.genish.gen.createCallback( this.graph, Gibberish.memory, false, true )
      this.inputNames = new Set( Gibberish.genish.gen.parameters ) 
      this.callback.ugenName = this.ugenName
      Gibberish.dirty( this )

      // if channel count has changed after recompiling graph...
      if( isStereo !== this.isStereo ) {
        //console.log( 'CHANGING STEREO:', isStereo )

        // check for any connections before iterating...
        if( this.connected === undefined ) return
        // loop through all busses the ugen is connected to
        for( let connection of this.connected ) {
          // set the dirty flag of the bus
          Gibberish.dirty( connection[ 0 ] )

          // check for inputs array, which indicates connection is to a bus
          if( connection[0].inputs !== undefined ) {
            // find the input in the busses 'inputs' array
            const inputIdx = connection[ 0 ].inputs.indexOf( connection[ 1 ] )

            // assumiing it is found...
            if( inputIdx !== -1 ) {
              // change stereo field
              connection[ 0 ].inputs[ inputIdx + 2 ] = this.isStereo
            }
          }else if( connection[0].input !== undefined ) {
            if( connection[0].__redoGraph !== undefined ) {
              connection[0].__redoGraph()
            }
          }
        }
      }
    },
  }

  return ugen

}

module.exports = __ugen

},{}],63:[function(require,module,exports){
const __proxy = require( './workletProxy.js' )
const effectProto = require( './fx/effect.js' )

module.exports = function( Gibberish ) {
  const proxy = __proxy( Gibberish )
  
  const factory = function( ugen, graph, __name, values, cb=null, shouldProxy = true ) {
    ugen.callback = cb === null ? Gibberish.genish.gen.createCallback( graph, Gibberish.memory, false, true ) : cb

    let name = Array.isArray( __name ) ? __name[ __name.length - 1 ] : __name

    Object.assign( ugen, {
      //type: 'ugen',
      id: values.id || Gibberish.utilities.getUID(), 
      ugenName: name + '_',
      graph: graph,
      inputNames: new Set( Gibberish.genish.gen.parameters ),
      isStereo: Array.isArray( graph ),
      dirty: true,
      __properties__:values,
      __addresses__:{}
    })
    
    ugen.ugenName += ugen.id
    ugen.callback.ugenName = ugen.ugenName // XXX hacky
    ugen.callback.id = ugen.id

    for( let param of ugen.inputNames ) {
      if( param === 'memory' ) continue

      let value = values[ param ],
          isNumber = !isNaN( value ),
          idx

      if( isNumber ) { 
        idx = Gibberish.memory.alloc( 1 )
        Gibberish.memory.heap[ idx ] = value
        ugen.__addresses__[ param ] = idx
      }

      // TODO: do we need to check for a setter?
      let desc = Object.getOwnPropertyDescriptor( ugen, param ),
          setter

      if( desc !== undefined ) {
        setter = desc.set
      }

      Object.defineProperty( ugen, param, {
        configurable:true,
        get() { 
          if( isNumber ) {
            return Gibberish.memory.heap[ idx ]
          }else{
            return value 
          }
        },
        set( v ) {
          //if( param === 'input' ) console.log( 'INPUT:', v, isNumber )
          if( value !== v ) {
            if( setter !== undefined ) setter( v )
            if( !isNaN( v ) ) {
              Gibberish.memory.heap[ idx ] = value = v
              if( isNumber === false ) Gibberish.dirty( ugen )
              isNumber = true
            }else{
              value = v
              /*if( isNumber === true )*/ Gibberish.dirty( ugen )
              //console.log( 'switching from number:', param, value )
              isNumber = false
            }
          }
        }
      })
    }

    // add bypass 
    if( effectProto.isPrototypeOf( ugen ) ) {
      let value = ugen.bypass
      Object.defineProperty( ugen, 'bypass', {
        configurable:true,
        get() { return value },
        set( v ) {
          if( value !== v ) {
            Gibberish.dirty( ugen )
            value = v
          }
        }
      })

    }

    if( ugen.__requiresRecompilation !== undefined ) {
      ugen.__requiresRecompilation.forEach( prop => {
        let value = values[ prop ]
        let isNumber = !isNaN( value )

        Object.defineProperty( ugen, prop, {
          configurable:true,
          get() { 
            if( isNumber ) {
              let idx = ugen.__addresses__[ prop ]
              return Gibberish.memory.heap[ idx ]
            }else{
              //console.log( 'returning:', prop, value, Gibberish.mode )
              return value 
            }
          },
          set( v ) {
            if( value !== v ) {
              if( !isNaN( v ) ) {
                let idx = ugen.__addresses__[ prop ]
                if( idx === undefined ){
                  idx = Gibberish.memory.alloc( 1 )
                  ugen.__addresses__[ prop ] = idx
                }
                value = values[ prop ] = Gibberish.memory.heap[ idx ] = v
                isNumber = true
              }else{
                value = values[ prop ] = v
                isNumber = false
                //console.log( 'setting ugen', value, Gibberish.mode )
                Gibberish.dirty( ugen )
              }

              //console.log( 'SETTING REDO GRAPH', prop, Gibberish.mode )
              
              // needed for filterType at the very least, becauae the props
              // are reused when re-creating the graph. This seems like a cheaper
              // way to solve this problem.
              //values[ prop ] = v

              this.__redoGraph()
            }
          }
        })
      })
    }

    // will only create proxy if worklets are being used
    // otherwise will return unaltered ugen

    if( values.shouldAddToUgen === true ) Object.assign( ugen, values )

    return shouldProxy ? proxy( __name, values, ugen ) : ugen
  }

  factory.getUID = () => { return Gibberish.utilities.getUID() }

  return factory
}

},{"./fx/effect.js":25,"./workletProxy.js":65}],64:[function(require,module,exports){
const genish = require( 'genish.js' )

module.exports = function( Gibberish ) {

let uid = 0
let sac = null
const utilities = {
  createContext( ctx, cb, resolve, __sac=null ) {
    let AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext

    sac = __sac

    let start = () => {
      if( typeof AC !== 'undefined' ) {
        Gibberish.ctx = ctx === undefined ? new AC() : ctx
        genish.gen.samplerate = Gibberish.ctx.sampleRate
        genish.utilities.ctx = Gibberish.ctx

        if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
          window.removeEventListener( 'touchstart', start )

          if( 'ontouchstart' in document.documentElement ){ // required to start audio under iOS 6
            let mySource = utilities.ctx.createBufferSource()
            mySource.connect( utilities.ctx.destination )
            mySource.noteOn( 0 )
          }
        }else{
          window.removeEventListener( 'mousedown', start )
          window.removeEventListener( 'keydown', start )
        }
      }

      if( typeof cb === 'function' ) cb( resolve )
    }

    if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
      window.addEventListener( 'touchstart', start )
    }else{
      window.addEventListener( 'mousedown', start )
      window.addEventListener( 'keydown', start )
    }

    return Gibberish.ctx
  },

  createScriptProcessor( resolve ) {
    Gibberish.node = Gibberish.ctx.createScriptProcessor( 1024, 0, 2 ),
    Gibberish.clearFunction = function() { return 0 },
    Gibberish.callback = Gibberish.clearFunction

    Gibberish.node.onaudioprocess = function( audioProcessingEvent ) {
      let gibberish = Gibberish,
          callback  = gibberish.callback,
          outputBuffer = audioProcessingEvent.outputBuffer,
          scheduler = Gibberish.scheduler,
          //objs = gibberish.callbackUgens.slice( 0 ),
          length

      let left = outputBuffer.getChannelData( 0 ),
          right= outputBuffer.getChannelData( 1 )

      let callbacklength = Gibberish.blockCallbacks.length
      
      if( callbacklength !== 0 ) {
        for( let i=0; i< callbacklength; i++ ) {
          Gibberish.blockCallbacks[ i ]()
        }

        // can't just set length to 0 as callbacks might be added during for loop, so splice pre-existing functions
        Gibberish.blockCallbacks.splice( 0, callbacklength )
      }

      for (let sample = 0, length = left.length; sample < length; sample++) {
        scheduler.tick()

        if( gibberish.graphIsDirty ) { 
          callback = gibberish.generateCallback()
        }
        
        // XXX cant use destructuring, babel makes it something inefficient...
        let out = callback.apply( null, gibberish.callbackUgens )

        left[ sample  ] = out[0]
        right[ sample ] = out[1]
      }
    }

    Gibberish.node.connect( Gibberish.ctx.destination )

    resolve()

    return Gibberish.node
  }, 

  createWorklet( resolve ) {
    Gibberish.ctx.audioWorklet.addModule( Gibberish.workletPath ).then( () => {
      Gibberish.worklet = new AudioWorkletNode( Gibberish.ctx, 'gibberish', { outputChannelCount:[2] } )
        //: new sac.AudioWorkletNode( Gibberish.ctx, 'gibbersh', { outputChannelCount:[2] } )

      Gibberish.worklet.connect( Gibberish.ctx.destination )
      Gibberish.worklet.port.onmessage = event => {
        Gibberish.utilities.workletHandlers[ event.data.address ]( event )        
      }
      Gibberish.worklet.ugens = new Map()

      resolve()
    })
  },

  workletHandlers: {
    get( event ) {
      let name = event.data.name
      let value
      if( name[0] === 'Gibberish' ) {
        value = Gibberish
        name.shift()
      }
      for( let segment of name ) {
        value = value[ segment ]
      }

      Gibberish.worklet.port.postMessage({
        address:'set',
        name:'Gibberish.' + name.join('.'),
        value
      })
    },
    state( event ){
      const messages = event.data.messages
      if( messages.length === 0 ) return

      // XXX is preventProxy actually used?
      Gibberish.preventProxy = true
      Gibberish.proxyEnabled = false

      for( let i = 0; i < messages.length; i+= 3 ) {
        const id = messages[ i ] 
        const propName = messages[ i + 1 ]
        const value = messages[ i + 2 ]
        const obj = Gibberish.worklet.ugens.get( id )

        if( obj !== undefined && propName.indexOf('.') === -1 && propName !== 'id' ) { 
          if( obj[ propName ] !== undefined ) {
            if( typeof obj[ propName ] !== 'function' ) {
              obj[ propName ] = value
            }else{
              obj[ propName ]( value )
            }
          }else{
            obj[ propName ] = value
          }
        }else if( obj !== undefined ) {
          const propSplit = propName.split('.')
          if( obj[ propSplit[ 0 ] ] !== undefined ) {
            if( typeof obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ] !== 'function' ) {
              obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ] = value
            }else{
              obj[ propSplit[ 0 ] ][ propSplit[ 1 ] ]( value )
            }
          }else{
            //console.log( 'undefined split property!', id, propSplit[0], propSplit[1], value, obj )
          }
        }
        // XXX double check and make sure this isn't getting sent back to processornode...
        // console.log( propName, value, obj )
      }
      Gibberish.preventProxy = false
      Gibberish.proxyEnabled = true
    }
  },

  wrap( func, ...args ) {
    const out = {
      action:'wrap',
      value:func,
      // must return objects containing only the id number to avoid
      // creating circular JSON references that would result from passing actual ugens
      args: args.map( v => { return { id:v.id } })
    }
    return out
  },

  export( obj ) {
    obj.wrap = this.wrap
  },

  getUID() { return uid++ }
}

return utilities

}

},{"genish.js":103}],65:[function(require,module,exports){
const serialize = require('serialize-javascript')

module.exports = function( Gibberish ) {

const replaceObj = function( obj, shouldSerializeFunctions = true ) {
  if( typeof obj === 'object' && obj !== null && obj.id !== undefined ) {
    if( obj.__type !== 'seq' ) { // XXX why?
      return { id:obj.id, prop:obj.prop }
    }else{
      // shouldn't I be serializing most objects, not just seqs?
      return serialize( obj )
    }
  }else if( typeof obj === 'function' && shouldSerializeFunctions === true ) {
    return { isFunc:true, value:serialize( obj ) }
  }
  return obj
}

const makeAndSendObject = function( __name, values, obj ) {
  const properties = {}

  // object has already been sent through messageport...

  for( let key in values ) {
    const alreadyProcessed = (typeof values[ key ] === 'object' && values[ key ] !== null && values[ key ].__meta__ !== undefined) ||
      (typeof values[key] === 'function' && values[ key ].__meta__ !== undefined )

    if( alreadyProcessed ) { 
      properties[ key ] = { id:values[ key ].__meta__.id }
    }else if( Array.isArray( values[ key ] ) ) {
      const arr = []
      for( let i = 0; i < values[ key ].length; i++ ) {
        arr[ i ] = replaceObj( values[ key ][i], false  )
      }
      properties[ key ] = arr
    }else if( typeof values[key] === 'object' && values[key] !== null ){
      properties[ key ] = replaceObj( values[ key ], false )
    }else{
      properties[ key ] = values[ key ]
    }
  }

  let serializedProperties = serialize( properties )

  if( Array.isArray( __name ) ) {
    const oldName = __name[ __name.length - 1 ]
    __name[ __name.length - 1 ] = oldName[0].toUpperCase() + oldName.substring(1)
  }else{
    __name = [ __name[0].toUpperCase() + __name.substring(1) ]
  }

  obj.__meta__ = {
    address:'add',
    name:__name,
    properties:serializedProperties, 
    id:obj.id
  }

  Gibberish.worklet.ugens.set( obj.id, obj )

  Gibberish.worklet.port.postMessage( obj.__meta__ )

}

const doNotProxy = [ 'connected', 'input', 'callback', 'inputNames' ]
   
const __proxy = function( __name, values, obj ) {

  if( Gibberish.mode === 'worklet' && Gibberish.preventProxy === false ) {

    makeAndSendObject( __name, values, obj )

    // proxy for all method calls to send to worklet
    const proxy = new Proxy( obj, {
      get( target, prop, receiver ) {
        if( typeof target[ prop ] === 'function' && prop.indexOf('__') === -1) {
          const proxy = new Proxy( target[ prop ], {
            apply( __target, thisArg, args ) {

              if( Gibberish.proxyEnabled === true ) {
                const __args = args.map( __value => replaceObj( __value, true ) )

                Gibberish.worklet.port.postMessage({ 
                  address:'method', 
                  object:obj.id,
                  name:prop,
                  args:__args
                })
              }

              const temp = Gibberish.proxyEnabled
              Gibberish.proxyEnabled = false
              const out =  __target.apply( thisArg, args )
              Gibberish.proxyEnabled = temp
              return out
            }
          })
          
          return proxy
        }

        return target[ prop ]
      },
      set( target, prop, value, receiver ) {
        if( doNotProxy.indexOf( prop ) === -1 ) { 
          if( Gibberish.proxyEnabled === true ) {
            const __value = replaceObj( value )

            if( __value !== undefined ) {
              Gibberish.worklet.port.postMessage({ 
                address:'set', 
                object:obj.id,
                name:prop,
                value:__value
              })
            }
          }
        }

        target[ prop ] = value

        // must return true for any ES6 proxy setter
        return true
      }
    })

    // XXX XXX XXX XXX XXX XXX
    // REMEMBER THAT YOU MUST ASSIGN THE RETURNED VALUE TO YOUR UGEN,
    // YOU CANNOT USE THIS FUNCTION TO MODIFY A UGEN IN PLACE.
    // XXX XXX XXX XXX XXX XXX

    return proxy
  }else if( Gibberish.mode === 'processor' && Gibberish.preventProxy === false ) {

    const proxy = new Proxy( obj, {
      //get( target, prop, receiver ) { return target[ prop ] },
      set( target, prop, value, receiver ) {
        let valueType = typeof value
        if( prop.indexOf('__') === -1 && valueType !== 'function' && valueType !== 'object' ) {
          if( Gibberish.processor !== undefined ) { 
            Gibberish.processor.messages.push( obj.id, prop, value )
          }
        }
        target[ prop ] = value

        // must return true for any ES6 proxy setter
        return true
      }
    })

    return proxy
  }

  return obj
}

return __proxy

}

},{"serialize-javascript":140}],66:[function(require,module,exports){
/* big.js v3.1.3 https://github.com/MikeMcl/big.js/LICENCE */
;(function (global) {
    'use strict';

/*
  big.js v3.1.3
  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
  https://github.com/MikeMcl/big.js/
  Copyright (c) 2014 Michael Mclaughlin <M8ch88l@gmail.com>
  MIT Expat Licence
*/

/***************************** EDITABLE DEFAULTS ******************************/

    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places of the results of operations
     * involving division: div and sqrt, and pow with negative exponents.
     */
    var DP = 20,                           // 0 to MAX_DP

        /*
         * The rounding mode used when rounding to the above decimal places.
         *
         * 0 Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
         * 1 To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
         * 2 To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
         * 3 Away from zero.                                  (ROUND_UP)
         */
        RM = 1,                            // 0, 1, 2 or 3

        // The maximum value of DP and Big.DP.
        MAX_DP = 1E6,                      // 0 to 1000000

        // The maximum magnitude of the exponent argument to the pow method.
        MAX_POWER = 1E6,                   // 1 to 1000000

        /*
         * The exponent value at and beneath which toString returns exponential
         * notation.
         * JavaScript's Number type: -7
         * -1000000 is the minimum recommended exponent value of a Big.
         */
        E_NEG = -7,                   // 0 to -1000000

        /*
         * The exponent value at and above which toString returns exponential
         * notation.
         * JavaScript's Number type: 21
         * 1000000 is the maximum recommended exponent value of a Big.
         * (This limit is not enforced or checked.)
         */
        E_POS = 21,                   // 0 to 1000000

/******************************************************************************/

        // The shared prototype object.
        P = {},
        isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
        Big;


    /*
     * Create and return a Big constructor.
     *
     */
    function bigFactory() {

        /*
         * The Big constructor and exported function.
         * Create and return a new instance of a Big number object.
         *
         * n {number|string|Big} A numeric value.
         */
        function Big(n) {
            var x = this;

            // Enable constructor usage without new.
            if (!(x instanceof Big)) {
                return n === void 0 ? bigFactory() : new Big(n);
            }

            // Duplicate.
            if (n instanceof Big) {
                x.s = n.s;
                x.e = n.e;
                x.c = n.c.slice();
            } else {
                parse(x, n);
            }

            /*
             * Retain a reference to this Big constructor, and shadow
             * Big.prototype.constructor which points to Object.
             */
            x.constructor = Big;
        }

        Big.prototype = P;
        Big.DP = DP;
        Big.RM = RM;
        Big.E_NEG = E_NEG;
        Big.E_POS = E_POS;

        return Big;
    }


    // Private functions


    /*
     * Return a string representing the value of Big x in normal or exponential
     * notation to dp fixed decimal places or significant digits.
     *
     * x {Big} The Big to format.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * toE {number} 1 (toExponential), 2 (toPrecision) or undefined (toFixed).
     */
    function format(x, dp, toE) {
        var Big = x.constructor,

            // The index (normal notation) of the digit that may be rounded up.
            i = dp - (x = new Big(x)).e,
            c = x.c;

        // Round?
        if (c.length > ++dp) {
            rnd(x, i, Big.RM);
        }

        if (!c[0]) {
            ++i;
        } else if (toE) {
            i = dp;

        // toFixed
        } else {
            c = x.c;

            // Recalculate i as x.e may have changed if value rounded up.
            i = x.e + i + 1;
        }

        // Append zeros?
        for (; c.length < i; c.push(0)) {
        }
        i = x.e;

        /*
         * toPrecision returns exponential notation if the number of
         * significant digits specified is less than the number of digits
         * necessary to represent the integer part of the value in normal
         * notation.
         */
        return toE === 1 || toE && (dp <= i || i <= Big.E_NEG) ?

          // Exponential notation.
          (x.s < 0 && c[0] ? '-' : '') +
            (c.length > 1 ? c[0] + '.' + c.join('').slice(1) : c[0]) +
              (i < 0 ? 'e' : 'e+') + i

          // Normal notation.
          : x.toString();
    }


    /*
     * Parse the number or string value passed to a Big constructor.
     *
     * x {Big} A Big number instance.
     * n {number|string} A numeric value.
     */
    function parse(x, n) {
        var e, i, nL;

        // Minus zero?
        if (n === 0 && 1 / n < 0) {
            n = '-0';

        // Ensure n is string and check validity.
        } else if (!isValid.test(n += '')) {
            throwErr(NaN);
        }

        // Determine sign.
        x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

        // Decimal point?
        if ((e = n.indexOf('.')) > -1) {
            n = n.replace('.', '');
        }

        // Exponential form?
        if ((i = n.search(/e/i)) > 0) {

            // Determine exponent.
            if (e < 0) {
                e = i;
            }
            e += +n.slice(i + 1);
            n = n.substring(0, i);

        } else if (e < 0) {

            // Integer.
            e = n.length;
        }

        nL = n.length;

        // Determine leading zeros.
        for (i = 0; i < nL && n.charAt(i) == '0'; i++) {
        }

        if (i == nL) {

            // Zero.
            x.c = [ x.e = 0 ];
        } else {

            // Determine trailing zeros.
            for (; nL > 0 && n.charAt(--nL) == '0';) {
            }

            x.e = e - i - 1;
            x.c = [];

            // Convert string to array of digits without leading/trailing zeros.
            //for (e = 0; i <= nL; x.c[e++] = +n.charAt(i++)) {
            for (; i <= nL; x.c.push(+n.charAt(i++))) {
            }
        }

        return x;
    }


    /*
     * Round Big x to a maximum of dp decimal places using rounding mode rm.
     * Called by div, sqrt and round.
     *
     * x {Big} The Big to round.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
     * [more] {boolean} Whether the result of division was truncated.
     */
    function rnd(x, dp, rm, more) {
        var u,
            xc = x.c,
            i = x.e + dp + 1;

        if (rm === 1) {

            // xc[i] is the digit after the digit that may be rounded up.
            more = xc[i] >= 5;
        } else if (rm === 2) {
            more = xc[i] > 5 || xc[i] == 5 &&
              (more || i < 0 || xc[i + 1] !== u || xc[i - 1] & 1);
        } else if (rm === 3) {
            more = more || xc[i] !== u || i < 0;
        } else {
            more = false;

            if (rm !== 0) {
                throwErr('!Big.RM!');
            }
        }

        if (i < 1 || !xc[0]) {

            if (more) {

                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                x.e = -dp;
                x.c = [1];
            } else {

                // Zero.
                x.c = [x.e = 0];
            }
        } else {

            // Remove any digits after the required decimal places.
            xc.length = i--;

            // Round up?
            if (more) {

                // Rounding up may mean the previous digit has to be rounded up.
                for (; ++xc[i] > 9;) {
                    xc[i] = 0;

                    if (!i--) {
                        ++x.e;
                        xc.unshift(1);
                    }
                }
            }

            // Remove trailing zeros.
            for (i = xc.length; !xc[--i]; xc.pop()) {
            }
        }

        return x;
    }


    /*
     * Throw a BigError.
     *
     * message {string} The error message.
     */
    function throwErr(message) {
        var err = new Error(message);
        err.name = 'BigError';

        throw err;
    }


    // Prototype/instance methods


    /*
     * Return a new Big whose value is the absolute value of this Big.
     */
    P.abs = function () {
        var x = new this.constructor(this);
        x.s = 1;

        return x;
    };


    /*
     * Return
     * 1 if the value of this Big is greater than the value of Big y,
     * -1 if the value of this Big is less than the value of Big y, or
     * 0 if they have the same value.
    */
    P.cmp = function (y) {
        var xNeg,
            x = this,
            xc = x.c,
            yc = (y = new x.constructor(y)).c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {
            return !xc[0] ? !yc[0] ? 0 : -j : i;
        }

        // Signs differ?
        if (i != j) {
            return i;
        }
        xNeg = i < 0;

        // Compare exponents.
        if (k != l) {
            return k > l ^ xNeg ? 1 : -1;
        }

        i = -1;
        j = (k = xc.length) < (l = yc.length) ? k : l;

        // Compare digit by digit.
        for (; ++i < j;) {

            if (xc[i] != yc[i]) {
                return xc[i] > yc[i] ^ xNeg ? 1 : -1;
            }
        }

        // Compare lengths.
        return k == l ? 0 : k > l ^ xNeg ? 1 : -1;
    };


    /*
     * Return a new Big whose value is the value of this Big divided by the
     * value of Big y, rounded, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     */
    P.div = function (y) {
        var x = this,
            Big = x.constructor,
            // dividend
            dvd = x.c,
            //divisor
            dvs = (y = new Big(y)).c,
            s = x.s == y.s ? 1 : -1,
            dp = Big.DP;

        if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!Big.DP!');
        }

        // Either 0?
        if (!dvd[0] || !dvs[0]) {

            // If both are 0, throw NaN
            if (dvd[0] == dvs[0]) {
                throwErr(NaN);
            }

            // If dvs is 0, throw +-Infinity.
            if (!dvs[0]) {
                throwErr(s / 0);
            }

            // dvd is 0, return +-0.
            return new Big(s * 0);
        }

        var dvsL, dvsT, next, cmp, remI, u,
            dvsZ = dvs.slice(),
            dvdI = dvsL = dvs.length,
            dvdL = dvd.length,
            // remainder
            rem = dvd.slice(0, dvsL),
            remL = rem.length,
            // quotient
            q = y,
            qc = q.c = [],
            qi = 0,
            digits = dp + (q.e = x.e - y.e) + 1;

        q.s = s;
        s = digits < 0 ? 0 : digits;

        // Create version of divisor with leading zero.
        dvsZ.unshift(0);

        // Add zeros to make remainder as long as divisor.
        for (; remL++ < dvsL; rem.push(0)) {
        }

        do {

            // 'next' is how many times the divisor goes into current remainder.
            for (next = 0; next < 10; next++) {

                // Compare divisor and remainder.
                if (dvsL != (remL = rem.length)) {
                    cmp = dvsL > remL ? 1 : -1;
                } else {

                    for (remI = -1, cmp = 0; ++remI < dvsL;) {

                        if (dvs[remI] != rem[remI]) {
                            cmp = dvs[remI] > rem[remI] ? 1 : -1;
                            break;
                        }
                    }
                }

                // If divisor < remainder, subtract divisor from remainder.
                if (cmp < 0) {

                    // Remainder can't be more than 1 digit longer than divisor.
                    // Equalise lengths using divisor with extra leading zero?
                    for (dvsT = remL == dvsL ? dvs : dvsZ; remL;) {

                        if (rem[--remL] < dvsT[remL]) {
                            remI = remL;

                            for (; remI && !rem[--remI]; rem[remI] = 9) {
                            }
                            --rem[remI];
                            rem[remL] += 10;
                        }
                        rem[remL] -= dvsT[remL];
                    }
                    for (; !rem[0]; rem.shift()) {
                    }
                } else {
                    break;
                }
            }

            // Add the 'next' digit to the result array.
            qc[qi++] = cmp ? next : ++next;

            // Update the remainder.
            if (rem[0] && cmp) {
                rem[remL] = dvd[dvdI] || 0;
            } else {
                rem = [ dvd[dvdI] ];
            }

        } while ((dvdI++ < dvdL || rem[0] !== u) && s--);

        // Leading zero? Do not remove if result is simply zero (qi == 1).
        if (!qc[0] && qi != 1) {

            // There can't be more than one zero.
            qc.shift();
            q.e--;
        }

        // Round?
        if (qi > digits) {
            rnd(q, dp, Big.RM, rem[0] !== u);
        }

        return q;
    };


    /*
     * Return true if the value of this Big is equal to the value of Big y,
     * otherwise returns false.
     */
    P.eq = function (y) {
        return !this.cmp(y);
    };


    /*
     * Return true if the value of this Big is greater than the value of Big y,
     * otherwise returns false.
     */
    P.gt = function (y) {
        return this.cmp(y) > 0;
    };


    /*
     * Return true if the value of this Big is greater than or equal to the
     * value of Big y, otherwise returns false.
     */
    P.gte = function (y) {
        return this.cmp(y) > -1;
    };


    /*
     * Return true if the value of this Big is less than the value of Big y,
     * otherwise returns false.
     */
    P.lt = function (y) {
        return this.cmp(y) < 0;
    };


    /*
     * Return true if the value of this Big is less than or equal to the value
     * of Big y, otherwise returns false.
     */
    P.lte = function (y) {
         return this.cmp(y) < 1;
    };


    /*
     * Return a new Big whose value is the value of this Big minus the value
     * of Big y.
     */
    P.sub = P.minus = function (y) {
        var i, j, t, xLTy,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.plus(y);
        }

        var xc = x.c.slice(),
            xe = x.e,
            yc = y.c,
            ye = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
        }

        // Determine which is the bigger number.
        // Prepend zeros to equalise exponents.
        if (a = xe - ye) {

            if (xLTy = a < 0) {
                a = -a;
                t = xc;
            } else {
                ye = xe;
                t = yc;
            }

            t.reverse();
            for (b = a; b--; t.push(0)) {
            }
            t.reverse();
        } else {

            // Exponents equal. Check digit by digit.
            j = ((xLTy = xc.length < yc.length) ? xc : yc).length;

            for (a = b = 0; b < j; b++) {

                if (xc[b] != yc[b]) {
                    xLTy = xc[b] < yc[b];
                    break;
                }
            }
        }

        // x < y? Point xc to the array of the bigger number.
        if (xLTy) {
            t = xc;
            xc = yc;
            yc = t;
            y.s = -y.s;
        }

        /*
         * Append zeros to xc if shorter. No need to add zeros to yc if shorter
         * as subtraction only needs to start at yc.length.
         */
        if (( b = (j = yc.length) - (i = xc.length) ) > 0) {

            for (; b--; xc[i++] = 0) {
            }
        }

        // Subtract yc from xc.
        for (b = i; j > a;){

            if (xc[--j] < yc[j]) {

                for (i = j; i && !xc[--i]; xc[i] = 9) {
                }
                --xc[i];
                xc[j] += 10;
            }
            xc[j] -= yc[j];
        }

        // Remove trailing zeros.
        for (; xc[--b] === 0; xc.pop()) {
        }

        // Remove leading zeros and adjust exponent accordingly.
        for (; xc[0] === 0;) {
            xc.shift();
            --ye;
        }

        if (!xc[0]) {

            // n - n = +0
            y.s = 1;

            // Result must be zero.
            xc = [ye = 0];
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a new Big whose value is the value of this Big modulo the
     * value of Big y.
     */
    P.mod = function (y) {
        var yGTx,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        if (!y.c[0]) {
            throwErr(NaN);
        }

        x.s = y.s = 1;
        yGTx = y.cmp(x) == 1;
        x.s = a;
        y.s = b;

        if (yGTx) {
            return new Big(x);
        }

        a = Big.DP;
        b = Big.RM;
        Big.DP = Big.RM = 0;
        x = x.div(y);
        Big.DP = a;
        Big.RM = b;

        return this.minus( x.times(y) );
    };


    /*
     * Return a new Big whose value is the value of this Big plus the value
     * of Big y.
     */
    P.add = P.plus = function (y) {
        var t,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.minus(y);
        }

        var xe = x.e,
            xc = x.c,
            ye = y.e,
            yc = y.c;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? y : new Big(xc[0] ? x : a * 0);
        }
        xc = xc.slice();

        // Prepend zeros to equalise exponents.
        // Note: Faster to use reverse then do unshifts.
        if (a = xe - ye) {

            if (a > 0) {
                ye = xe;
                t = yc;
            } else {
                a = -a;
                t = xc;
            }

            t.reverse();
            for (; a--; t.push(0)) {
            }
            t.reverse();
        }

        // Point xc to the longer array.
        if (xc.length - yc.length < 0) {
            t = yc;
            yc = xc;
            xc = t;
        }
        a = yc.length;

        /*
         * Only start adding at yc.length - 1 as the further digits of xc can be
         * left as they are.
         */
        for (b = 0; a;) {
            b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;
            xc[a] %= 10;
        }

        // No need to check for zero, as +x + +y != 0 && -x + -y != 0

        if (b) {
            xc.unshift(b);
            ++ye;
        }

         // Remove trailing zeros.
        for (a = xc.length; xc[--a] === 0; xc.pop()) {
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a Big whose value is the value of this Big raised to the power n.
     * If n is negative, round, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     *
     * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
     */
    P.pow = function (n) {
        var x = this,
            one = new x.constructor(1),
            y = one,
            isNeg = n < 0;

        if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
            throwErr('!pow!');
        }

        n = isNeg ? -n : n;

        for (;;) {

            if (n & 1) {
                y = y.times(x);
            }
            n >>= 1;

            if (!n) {
                break;
            }
            x = x.times(x);
        }

        return isNeg ? one.div(y) : y;
    };


    /*
     * Return a new Big whose value is the value of this Big rounded to a
     * maximum of dp decimal places using rounding mode rm.
     * If dp is not specified, round to 0 decimal places.
     * If rm is not specified, use Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     * [rm] 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
     */
    P.round = function (dp, rm) {
        var x = this,
            Big = x.constructor;

        if (dp == null) {
            dp = 0;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!round!');
        }
        rnd(x = new Big(x), dp, rm == null ? Big.RM : rm);

        return x;
    };


    /*
     * Return a new Big whose value is the square root of the value of this Big,
     * rounded, if necessary, to a maximum of Big.DP decimal places using
     * rounding mode Big.RM.
     */
    P.sqrt = function () {
        var estimate, r, approx,
            x = this,
            Big = x.constructor,
            xc = x.c,
            i = x.s,
            e = x.e,
            half = new Big('0.5');

        // Zero?
        if (!xc[0]) {
            return new Big(x);
        }

        // If negative, throw NaN.
        if (i < 0) {
            throwErr(NaN);
        }

        // Estimate.
        i = Math.sqrt(x.toString());

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the result exponent.
        if (i === 0 || i === 1 / 0) {
            estimate = xc.join('');

            if (!(estimate.length + e & 1)) {
                estimate += '0';
            }

            r = new Big( Math.sqrt(estimate).toString() );
            r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
        } else {
            r = new Big(i.toString());
        }

        i = r.e + (Big.DP += 4);

        // Newton-Raphson iteration.
        do {
            approx = r;
            r = half.times( approx.plus( x.div(approx) ) );
        } while ( approx.c.slice(0, i).join('') !==
                       r.c.slice(0, i).join('') );

        rnd(r, Big.DP -= 4, Big.RM);

        return r;
    };


    /*
     * Return a new Big whose value is the value of this Big times the value of
     * Big y.
     */
    P.mul = P.times = function (y) {
        var c,
            x = this,
            Big = x.constructor,
            xc = x.c,
            yc = (y = new Big(y)).c,
            a = xc.length,
            b = yc.length,
            i = x.e,
            j = y.e;

        // Determine sign of result.
        y.s = x.s == y.s ? 1 : -1;

        // Return signed 0 if either 0.
        if (!xc[0] || !yc[0]) {
            return new Big(y.s * 0);
        }

        // Initialise exponent of result as x.e + y.e.
        y.e = i + j;

        // If array xc has fewer digits than yc, swap xc and yc, and lengths.
        if (a < b) {
            c = xc;
            xc = yc;
            yc = c;
            j = a;
            a = b;
            b = j;
        }

        // Initialise coefficient array of result with zeros.
        for (c = new Array(j = a + b); j--; c[j] = 0) {
        }

        // Multiply.

        // i is initially xc.length.
        for (i = b; i--;) {
            b = 0;

            // a is yc.length.
            for (j = a + i; j > i;) {

                // Current sum of products at this digit position, plus carry.
                b = c[j] + yc[i] * xc[j - i - 1] + b;
                c[j--] = b % 10;

                // carry
                b = b / 10 | 0;
            }
            c[j] = (c[j] + b) % 10;
        }

        // Increment result exponent if there is a final carry.
        if (b) {
            ++y.e;
        }

        // Remove any leading zero.
        if (!c[0]) {
            c.shift();
        }

        // Remove trailing zeros.
        for (i = c.length; !c[--i]; c.pop()) {
        }
        y.c = c;

        return y;
    };


    /*
     * Return a string representing the value of this Big.
     * Return exponential notation if this Big has a positive exponent equal to
     * or greater than Big.E_POS, or a negative exponent equal to or less than
     * Big.E_NEG.
     */
    P.toString = P.valueOf = P.toJSON = function () {
        var x = this,
            Big = x.constructor,
            e = x.e,
            str = x.c.join(''),
            strL = str.length;

        // Exponential notation?
        if (e <= Big.E_NEG || e >= Big.E_POS) {
            str = str.charAt(0) + (strL > 1 ? '.' + str.slice(1) : '') +
              (e < 0 ? 'e' : 'e+') + e;

        // Negative exponent?
        } else if (e < 0) {

            // Prepend zeros.
            for (; ++e; str = '0' + str) {
            }
            str = '0.' + str;

        // Positive exponent?
        } else if (e > 0) {

            if (++e > strL) {

                // Append zeros.
                for (e -= strL; e-- ; str += '0') {
                }
            } else if (e < strL) {
                str = str.slice(0, e) + '.' + str.slice(e);
            }

        // Exponent zero.
        } else if (strL > 1) {
            str = str.charAt(0) + '.' + str.slice(1);
        }

        // Avoid '-0'
        return x.s < 0 && x.c[0] ? '-' + str : str;
    };


    /*
     ***************************************************************************
     * If toExponential, toFixed, toPrecision and format are not required they
     * can safely be commented-out or deleted. No redundant code will be left.
     * format is used only by toExponential, toFixed and toPrecision.
     ***************************************************************************
     */


    /*
     * Return a string representing the value of this Big in exponential
     * notation to dp fixed decimal places and rounded, if necessary, using
     * Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toExponential = function (dp) {

        if (dp == null) {
            dp = this.c.length - 1;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!toExp!');
        }

        return format(this, dp, 1);
    };


    /*
     * Return a string representing the value of this Big in normal notation
     * to dp fixed decimal places and rounded, if necessary, using Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toFixed = function (dp) {
        var str,
            x = this,
            Big = x.constructor,
            neg = Big.E_NEG,
            pos = Big.E_POS;

        // Prevent the possibility of exponential notation.
        Big.E_NEG = -(Big.E_POS = 1 / 0);

        if (dp == null) {
            str = x.toString();
        } else if (dp === ~~dp && dp >= 0 && dp <= MAX_DP) {
            str = format(x, x.e + dp);

            // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
            // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
            if (x.s < 0 && x.c[0] && str.indexOf('-') < 0) {
        //E.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
                str = '-' + str;
            }
        }
        Big.E_NEG = neg;
        Big.E_POS = pos;

        if (!str) {
            throwErr('!toFix!');
        }

        return str;
    };


    /*
     * Return a string representing the value of this Big rounded to sd
     * significant digits using Big.RM. Use exponential notation if sd is less
     * than the number of digits necessary to represent the integer part of the
     * value in normal notation.
     *
     * sd {number} Integer, 1 to MAX_DP inclusive.
     */
    P.toPrecision = function (sd) {

        if (sd == null) {
            return this.toString();
        } else if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
            throwErr('!toPre!');
        }

        return format(this, sd - 1, 2);
    };


    // Export


    Big = bigFactory();

    //AMD.
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Big;
        });

    // Node and other CommonJS-like environments that support module.exports.
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Big;
        module.exports.Big = Big;

    //Browser.
    } else {
        global.Big = Big;
    }
})(this);

},{}],67:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'abs',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.abs })

      out = `gen.abs( ${inputs[0]} )`

    } else {
      out = Math.abs( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let abs = Object.create( proto )

  abs.inputs = [ x ]

  return abs
}

},{"./gen.js":96}],68:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'accum',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        genName = 'gen.' + this.name,
        functionBody

    gen.requestMemory( this.memory )

    gen.memory.heap[ this.memory.value.idx ] = this.initialValue

    functionBody = this.callback( genName, inputs[0], inputs[1], `memory[${this.memory.value.idx}]` )

    gen.closures.add({ [ this.name ]: this }) 

    gen.memo[ this.name ] = this.name + '_value'
    
    return [ this.name + '_value', functionBody ]
  },

  callback( _name, _incr, _reset, valueRef ) {
    let diff = this.max - this.min,
        out = '',
        wrap = ''
    
    /* three different methods of wrapping, third is most expensive:
     *
     * 1: range {0,1}: y = x - (x | 0)
     * 2: log2(this.max) == integer: y = x & (this.max - 1)
     * 3: all others: if( x >= this.max ) y = this.max -x
     *
     */

    // must check for reset before storing value for output
    if( !(typeof this.inputs[1] === 'number' && this.inputs[1] < 1) ) { 
      if( this.initialValue !== this.min ) {
        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
      }else{
        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.initialValue}\n\n`
      }
    }

    out += `  var ${this.name}_value = ${valueRef}\n`
    
    if( this.shouldWrap === false && this.shouldClamp === true ) {
      out += `  if( ${valueRef} < ${this.max } ) ${valueRef} += ${_incr}\n`
    }else{
      out += `  ${valueRef} += ${_incr}\n` // store output value before accumulating  
    }

    if( this.max !== Infinity  && this.shouldWrapMax ) wrap += `  if( ${valueRef} >= ${this.max} ) ${valueRef} -= ${diff}\n`
    if( this.min !== -Infinity && this.shouldWrapMin ) wrap += `  if( ${valueRef} < ${this.min} ) ${valueRef} += ${diff}\n`

    //if( this.min === 0 && this.max === 1 ) { 
    //  wrap =  `  ${valueRef} = ${valueRef} - (${valueRef} | 0)\n\n`
    //} else if( this.min === 0 && ( Math.log2( this.max ) | 0 ) === Math.log2( this.max ) ) {
    //  wrap =  `  ${valueRef} = ${valueRef} & (${this.max} - 1)\n\n`
    //} else if( this.max !== Infinity ){
    //  wrap = `  if( ${valueRef} >= ${this.max} ) ${valueRef} -= ${diff}\n\n`
    //}

    out = out + wrap + '\n'

    return out
  }
}

module.exports = ( incr, reset=0, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { min:0, max:1, shouldWrap:true, shouldWrapMax: true, shouldWrapMin:true, shouldClamp:false }
  
  if( properties !== undefined ) Object.assign( defaults, properties )

  if( defaults.initialValue === undefined ) defaults.initialValue = defaults.min

  Object.assign( ugen, { 
    min: defaults.min, 
    max: defaults.max,
    initial: defaults.initialValue,
    uid:    gen.getUID(),
    inputs: [ incr, reset ],
    memory: {
      value: { length:1, idx:null }
    }
  },
  defaults )

  Object.defineProperty( ugen, 'value', {
    get() { return gen.memory.heap[ this.memory.value.idx ] },
    set(v) { gen.memory.heap[ this.memory.value.idx ] = v }
  })

  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],69:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'acos',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'acos': Math.acos })

      out = `gen.acos( ${inputs[0]} )` 

    } else {
      out = Math.acos( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let acos = Object.create( proto )

  acos.inputs = [ x ]
  acos.id = gen.getUID()
  acos.name = `${acos.basename}{acos.id}`

  return acos
}

},{"./gen.js":96}],70:[function(require,module,exports){
'use strict'

let gen      = require( './gen.js' ),
    mul      = require( './mul.js' ),
    sub      = require( './sub.js' ),
    div      = require( './div.js' ),
    data     = require( './data.js' ),
    peek     = require( './peek.js' ),
    accum    = require( './accum.js' ),
    ifelse   = require( './ifelseif.js' ),
    lt       = require( './lt.js' ),
    bang     = require( './bang.js' ),
    env      = require( './env.js' ),
    add      = require( './add.js' ),
    poke     = require( './poke.js' ),
    neq      = require( './neq.js' ),
    and      = require( './and.js' ),
    gte      = require( './gte.js' ),
    memo     = require( './memo.js' )

module.exports = ( attackTime = 44100, decayTime = 44100, _props ) => {
  let _bang = bang(),
      phase = accum( 1, _bang, { min:0, max: Infinity, initialValue:-Infinity, shouldWrap:false }),
      props = Object.assign({}, { shape:'exponential', alpha:5 }, _props ),
      bufferData, bufferDataReverse, decayData, out, buffer

  //console.log( 'shape:', props.shape, 'attack time:', attackTime, 'decay time:', decayTime )
  let completeFlag = data( [0] )
  
  // slightly more efficient to use existing phase accumulator for linear envelopes
  if( props.shape === 'linear' ) {
    out = ifelse( 
      and( gte( phase, 0), lt( phase, attackTime )),
      div( phase, attackTime ),

      and( gte( phase, 0),  lt( phase, add( attackTime, decayTime ) ) ),
      sub( 1, div( sub( phase, attackTime ), decayTime ) ),
      
      neq( phase, -Infinity),
      poke( completeFlag, 1, 0, { inline:0 }),

      0 
    )
  } else {
    bufferData = env({ length:1024, type:props.shape, alpha:props.alpha })
    bufferDataReverse = env({ length:1024, type:props.shape, alpha:props.alpha, reverse:true })

    out = ifelse( 
      and( gte( phase, 0), lt( phase, attackTime ) ), 
      peek( bufferData, div( phase, attackTime ), { boundmode:'clamp' } ), 

      and( gte(phase,0), lt( phase, add( attackTime, decayTime ) ) ), 
      peek( bufferDataReverse, div( sub( phase, attackTime ), decayTime ), { boundmode:'clamp' }),

      neq( phase, -Infinity ),
      poke( completeFlag, 1, 0, { inline:0 }),

      0
    )
  }

  out.isComplete = ()=> gen.memory.heap[ completeFlag.memory.values.idx ]

  out.trigger = ()=> {
    gen.memory.heap[ completeFlag.memory.values.idx ] = 0
    _bang.trigger()
  }

  return out 
}

},{"./accum.js":68,"./add.js":71,"./and.js":73,"./bang.js":77,"./data.js":84,"./div.js":89,"./env.js":90,"./gen.js":96,"./gte.js":98,"./ifelseif.js":101,"./lt.js":104,"./memo.js":108,"./mul.js":114,"./neq.js":115,"./peek.js":120,"./poke.js":122,"./sub.js":131}],71:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = { 
  basename:'add',
  gen() {
    let inputs = gen.getInputs( this ),
        out='',
        sum = 0, numCount = 0, adderAtEnd = false, alreadyFullSummed = true

    if( inputs.length === 0 ) return 0

    out = `  var ${this.name} = `

    inputs.forEach( (v,i) => {
      if( isNaN( v ) ) {
        out += v
        if( i < inputs.length -1 ) {
          adderAtEnd = true
          out += ' + '
        }
        alreadyFullSummed = false
      }else{
        sum += parseFloat( v )
        numCount++
      }
    })

    if( numCount > 0 ) {
      out += adderAtEnd || alreadyFullSummed ? sum : ' + ' + sum
    }

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = ( ...args ) => {
  const add = Object.create( proto )
  add.id = gen.getUID()
  add.name = add.basename + add.id
  add.inputs = args

  return add
}

},{"./gen.js":96}],72:[function(require,module,exports){
'use strict'

let gen      = require( './gen.js' ),
    mul      = require( './mul.js' ),
    sub      = require( './sub.js' ),
    div      = require( './div.js' ),
    data     = require( './data.js' ),
    peek     = require( './peek.js' ),
    accum    = require( './accum.js' ),
    ifelse   = require( './ifelseif.js' ),
    lt       = require( './lt.js' ),
    bang     = require( './bang.js' ),
    env      = require( './env.js' ),
    param    = require( './param.js' ),
    add      = require( './add.js' ),
    gtp      = require( './gtp.js' ),
    not      = require( './not.js' ),
    and      = require( './and.js' ),
    neq      = require( './neq.js' ),
    poke     = require( './poke.js' )

module.exports = ( attackTime=44, decayTime=22050, sustainTime=44100, sustainLevel=.6, releaseTime=44100, _props ) => {
  let envTrigger = bang(),
      phase = accum( 1, envTrigger, { max: Infinity, shouldWrap:false, initialValue:Infinity }),
      shouldSustain = param( 1 ),
      defaults = {
         shape: 'exponential',
         alpha: 5,
         triggerRelease: false,
      },
      props = Object.assign({}, defaults, _props ),
      bufferData, decayData, out, buffer, sustainCondition, releaseAccum, releaseCondition


  const completeFlag = data( [0] )

  bufferData = env({ length:1024, alpha:props.alpha, shift:0, type:props.shape })

  sustainCondition = props.triggerRelease 
    ? shouldSustain
    : lt( phase, add( attackTime, decayTime, sustainTime ) )

  releaseAccum = props.triggerRelease
    ? gtp( sub( sustainLevel, accum( div( sustainLevel, releaseTime ) , 0, { shouldWrap:false }) ), 0 )
    : sub( sustainLevel, mul( div( sub( phase, add( attackTime, decayTime, sustainTime ) ), releaseTime ), sustainLevel ) ), 

  releaseCondition = props.triggerRelease
    ? not( shouldSustain )
    : lt( phase, add( attackTime, decayTime, sustainTime, releaseTime ) )

  out = ifelse(
    // attack 
    lt( phase,  attackTime ), 
    peek( bufferData, div( phase, attackTime ), { boundmode:'clamp' } ), 

    // decay
    lt( phase, add( attackTime, decayTime ) ), 
    peek( bufferData, sub( 1, mul( div( sub( phase,  attackTime ),  decayTime ), sub( 1,  sustainLevel ) ) ), { boundmode:'clamp' }),

    // sustain
    and( sustainCondition, neq( phase, Infinity ) ),
    peek( bufferData,  sustainLevel ),

    // release
    releaseCondition, //lt( phase,  attackTime +  decayTime +  sustainTime +  releaseTime ),
    peek( 
      bufferData,
      releaseAccum, 
      //sub(  sustainLevel, mul( div( sub( phase,  attackTime +  decayTime +  sustainTime),  releaseTime ),  sustainLevel ) ), 
      { boundmode:'clamp' }
    ),

    neq( phase, Infinity ),
    poke( completeFlag, 1, 0, { inline:0 }),

    0
  )
   
  out.trigger = ()=> {
    shouldSustain.value = 1
    envTrigger.trigger()
  }

  out.isComplete = ()=> gen.memory.heap[ completeFlag.memory.values.idx ]

  out.release = ()=> {
    shouldSustain.value = 0
    // XXX pretty nasty... grabs accum inside of gtp and resets value manually
    // unfortunately envTrigger won't work as it's back to 0 by the time the release block is triggered...
    gen.memory.heap[ releaseAccum.inputs[0].inputs[1].memory.value.idx ] = 0
  }

  return out 
}

},{"./accum.js":68,"./add.js":71,"./and.js":73,"./bang.js":77,"./data.js":84,"./div.js":89,"./env.js":90,"./gen.js":96,"./gtp.js":99,"./ifelseif.js":101,"./lt.js":104,"./mul.js":114,"./neq.js":115,"./not.js":117,"./param.js":119,"./peek.js":120,"./poke.js":122,"./sub.js":131}],73:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'and',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = `  var ${this.name} = (${inputs[0]} !== 0 && ${inputs[1]} !== 0) | 0\n\n`

    gen.memo[ this.name ] = `${this.name}`

    return [ `${this.name}`, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],74:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'asin',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'asin': Math.asin })

      out = `gen.asin( ${inputs[0]} )` 

    } else {
      out = Math.asin( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let asin = Object.create( proto )

  asin.inputs = [ x ]
  asin.id = gen.getUID()
  asin.name = `${asin.basename}{asin.id}`

  return asin
}

},{"./gen.js":96}],75:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'atan',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'atan': Math.atan })

      out = `gen.atan( ${inputs[0]} )` 

    } else {
      out = Math.atan( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let atan = Object.create( proto )

  atan.inputs = [ x ]
  atan.id = gen.getUID()
  atan.name = `${atan.basename}{atan.id}`

  return atan
}

},{"./gen.js":96}],76:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    mul     = require( './mul.js' ),
    sub     = require( './sub.js' )

module.exports = ( decayTime = 44100 ) => {
  let ssd = history ( 1 ),
      t60 = Math.exp( -6.907755278921 / decayTime )

  ssd.in( mul( ssd.out, t60 ) )

  ssd.out.trigger = ()=> {
    ssd.value = 1
  }

  return sub( 1, ssd.out )
}

},{"./gen.js":96,"./history.js":100,"./mul.js":114,"./sub.js":131}],77:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  gen() {
    gen.requestMemory( this.memory )
    
    let out = 
`  var ${this.name} = memory[${this.memory.value.idx}]
  if( ${this.name} === 1 ) memory[${this.memory.value.idx}] = 0      
      
`
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  } 
}

module.exports = ( _props ) => {
  let ugen = Object.create( proto ),
      props = Object.assign({}, { min:0, max:1 }, _props )

  ugen.name = 'bang' + gen.getUID()

  ugen.min = props.min
  ugen.max = props.max

  ugen.trigger = () => {
    gen.memory.heap[ ugen.memory.value.idx ] = ugen.max 
  }

  ugen.memory = {
    value: { length:1, idx:null }
  }

  return ugen
}

},{"./gen.js":96}],78:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'bool',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = `${inputs[0]} === 0 ? 0 : 1`
    
    //gen.memo[ this.name ] = `gen.data.${this.name}`

    //return [ `gen.data.${this.name}`, ' ' +out ]
    return out
  }
}

module.exports = ( in1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    uid:        gen.getUID(),
    inputs:     [ in1 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}


},{"./gen.js":96}],79:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'ceil',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.ceil })

      out = `gen.ceil( ${inputs[0]} )`

    } else {
      out = Math.ceil( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let ceil = Object.create( proto )

  ceil.inputs = [ x ]

  return ceil
}

},{"./gen.js":96}],80:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    floor= require('./floor.js'),
    sub  = require('./sub.js'),
    memo = require('./memo.js')

let proto = {
  basename:'clip',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        out

    out =

` var ${this.name} = ${inputs[0]}
  if( ${this.name} > ${inputs[2]} ) ${this.name} = ${inputs[2]}
  else if( ${this.name} < ${inputs[1]} ) ${this.name} = ${inputs[1]}
`
    out = ' ' + out
    
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  },
}

module.exports = ( in1, min=-1, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1, min, max ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./floor.js":93,"./gen.js":96,"./memo.js":108,"./sub.js":131}],81:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'cos',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'cos': Math.cos })

      out = `gen.cos( ${inputs[0]} )` 

    } else {
      out = Math.cos( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let cos = Object.create( proto )

  cos.inputs = [ x ]
  cos.id = gen.getUID()
  cos.name = `${cos.basename}{cos.id}`

  return cos
}

},{"./gen.js":96}],82:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'counter',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        genName = 'gen.' + this.name,
        functionBody
       
    if( this.memory.value.idx === null ) gen.requestMemory( this.memory )
    functionBody  = this.callback( genName, inputs[0], inputs[1], inputs[2], inputs[3], inputs[4],  `memory[${this.memory.value.idx}]`, `memory[${this.memory.wrap.idx}]`  )

    gen.closures.add({ [ this.name ]: this }) 

    gen.memo[ this.name ] = this.name + '_value'
   
    if( gen.memo[ this.wrap.name ] === undefined ) this.wrap.gen()

    return [ this.name + '_value', functionBody ]
  },

  callback( _name, _incr, _min, _max, _reset, loops, valueRef, wrapRef ) {
    let diff = this.max - this.min,
        out = '',
        wrap = ''
    // must check for reset before storing value for output
    if( !(typeof this.inputs[3] === 'number' && this.inputs[3] < 1) ) { 
      out += `  if( ${_reset} >= 1 ) ${valueRef} = ${_min}\n`
    }

    out += `  var ${this.name}_value = ${valueRef};\n  ${valueRef} += ${_incr}\n` // store output value before accumulating  
    
    if( typeof this.max === 'number' && this.max !== Infinity && typeof this.min !== 'number' ) {
      wrap = 
`  if( ${valueRef} >= ${this.max} &&  ${loops} > 0) {
    ${valueRef} -= ${diff}
    ${wrapRef} = 1
  }else{
    ${wrapRef} = 0
  }\n`
    }else if( this.max !== Infinity && this.min !== Infinity ) {
      wrap = 
`  if( ${valueRef} >= ${_max} &&  ${loops} > 0) {
    ${valueRef} -= ${_max} - ${_min}
    ${wrapRef} = 1
  }else if( ${valueRef} < ${_min} &&  ${loops} > 0) {
    ${valueRef} += ${_max} - ${_min}
    ${wrapRef} = 1
  }else{
    ${wrapRef} = 0
  }\n`
    }else{
      out += '\n'
    }

    out = out + wrap

    return out
  }
}

module.exports = ( incr=1, min=0, max=Infinity, reset=0, loops=1,  properties ) => {
  let ugen = Object.create( proto ),
      defaults = { initialValue: 0, shouldWrap:true }

  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    min:    min, 
    max:    max,
    value:  defaults.initialValue,
    uid:    gen.getUID(),
    inputs: [ incr, min, max, reset, loops ],
    memory: {
      value: { length:1, idx: null },
      wrap:  { length:1, idx: null } 
    },
    wrap : {
      gen() { 
        if( ugen.memory.wrap.idx === null ) {
          gen.requestMemory( ugen.memory )
        }
        gen.getInputs( this )
        gen.memo[ this.name ] = `memory[ ${ugen.memory.wrap.idx} ]`
        return `memory[ ${ugen.memory.wrap.idx} ]` 
      }
    }
  },
  defaults )
 
  Object.defineProperty( ugen, 'value', {
    get() {
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        gen.memory.heap[ this.memory.value.idx ] = v 
      }
    }
  })
  
  ugen.wrap.inputs = [ ugen ]
  ugen.name = `${ugen.basename}${ugen.uid}`
  ugen.wrap.name = ugen.name + '_wrap'
  return ugen
} 

},{"./gen.js":96}],83:[function(require,module,exports){
'use strict'

let gen  = require( './gen.js' ),
    accum= require( './phasor.js' ),
    data = require( './data.js' ),
    peek = require( './peek.js' ),
    mul  = require( './mul.js' ),
    phasor=require( './phasor.js')

let proto = {
  basename:'cycle',

  initTable() {    
    let buffer = new Float32Array( 1024 )

    for( let i = 0, l = buffer.length; i < l; i++ ) {
      buffer[ i ] = Math.sin( ( i / l ) * ( Math.PI * 2 ) )
    }

    gen.globals.cycle = data( buffer, 1, { immutable:true } )
  }

}

module.exports = ( frequency=1, reset=0, _props ) => {
  if( typeof gen.globals.cycle === 'undefined' ) proto.initTable() 
  const props = Object.assign({}, { min:0 }, _props )

  const ugen = peek( gen.globals.cycle, phasor( frequency, reset, props ))
  ugen.name = 'cycle' + gen.getUID()

  return ugen
}

},{"./data.js":84,"./gen.js":96,"./mul.js":114,"./peek.js":120,"./phasor.js":121}],84:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
  utilities = require( './utilities.js' ),
  peek = require('./peek.js'),
  poke = require('./poke.js')

let proto = {
  basename:'data',
  globals: {},

  gen() {
    let idx
    if( gen.memo[ this.name ] === undefined ) {
      let ugen = this
      gen.requestMemory( this.memory, this.immutable ) 
      idx = this.memory.values.idx
      try {
        gen.memory.heap.set( this.buffer, idx )
      }catch( e ) {
        console.log( e )
        throw Error( 'error with request. asking for ' + this.buffer.length +'. current index: ' + gen.memoryIndex + ' of ' + gen.memory.heap.length )
      }
      //gen.data[ this.name ] = this
      //return 'gen.memory' + this.name + '.buffer'
      gen.memo[ this.name ] = idx
    }else{
      idx = gen.memo[ this.name ]
    }
    return idx
  },
}

module.exports = ( x, y=1, properties ) => {
  let ugen, buffer, shouldLoad = false
  
  if( properties !== undefined && properties.global !== undefined ) {
    if( gen.globals[ properties.global ] ) {
      return gen.globals[ properties.global ]
    }
  }

  if( typeof x === 'number' ) {
    if( y !== 1 ) {
      buffer = []
      for( let i = 0; i < y; i++ ) {
        buffer[ i ] = new Float32Array( x )
      }
    }else{
      buffer = new Float32Array( x )
    }
  }else if( Array.isArray( x ) ) { //! (x instanceof Float32Array ) ) {
    let size = x.length
    buffer = new Float32Array( size )
    for( let i = 0; i < x.length; i++ ) {
      buffer[ i ] = x[ i ]
    }
  }else if( typeof x === 'string' ) {
    buffer = { length: y > 1 ? y : gen.samplerate * 60 } // XXX what???
    shouldLoad = true
  }else if( x instanceof Float32Array ) {
    buffer = x
  }
  
  ugen = { 
    buffer,
    name: proto.basename + gen.getUID(),
    dim:  buffer.length, // XXX how do we dynamically allocate this?
    channels : 1,
    gen:  proto.gen,
    onload: null,
    then( fnc ) {
      ugen.onload = fnc
      return ugen
    },
    immutable: properties !== undefined && properties.immutable === true ? true : false,
    load( filename ) {
      let promise = utilities.loadSample( filename, ugen )
      promise.then( ( _buffer )=> { 
        ugen.memory.values.length = ugen.dim = _buffer.length     
        ugen.onload() 
      })
    },
  }

  ugen.memory = {
    values: { length:ugen.dim, idx:null }
  }

  gen.name = 'data' + gen.getUID()

  if( shouldLoad ) ugen.load( x )
  
  if( properties !== undefined ) {
    if( properties.global !== undefined ) {
      gen.globals[ properties.global ] = ugen
    }
    if( properties.meta === true ) {
      for( let i = 0, length = ugen.buffer.length; i < length; i++ ) {
        Object.defineProperty( ugen, i, {
          get () {
            return peek( ugen, i, { mode:'simple', interp:'none' } )
          },
          set( v ) {
            return poke( ugen, v, i )
          }
        })
      }
    }
  }

  return ugen
}

},{"./gen.js":96,"./peek.js":120,"./poke.js":122,"./utilities.js":137}],85:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' )

module.exports = ( in1 ) => {
  let x1 = history(),
      y1 = history(),
      filter

  //History x1, y1; y = in1 - x1 + y1*0.9997; x1 = in1; y1 = y; out1 = y;
  filter = memo( add( sub( in1, x1.out ), mul( y1.out, .9997 ) ) )
  x1.in( in1 )
  y1.in( filter )

  return filter
}

},{"./add.js":71,"./gen.js":96,"./history.js":100,"./memo.js":108,"./mul.js":114,"./sub.js":131}],86:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    mul     = require( './mul.js' ),
    t60     = require( './t60.js' )

module.exports = ( decayTime = 44100, props ) => {
  let properties = Object.assign({}, { initValue:1 }, props ),
      ssd = history ( properties.initValue )

  ssd.in( mul( ssd.out, t60( decayTime ) ) )

  ssd.out.trigger = ()=> {
    ssd.value = 1
  }

  return ssd.out 
}

},{"./gen.js":96,"./history.js":100,"./mul.js":114,"./t60.js":133}],87:[function(require,module,exports){
'use strict'

const gen  = require( './gen.js'  ),
      data = require( './data.js' ),
      poke = require( './poke.js' ),
      peek = require( './peek.js' ),
      sub  = require( './sub.js'  ),
      wrap = require( './wrap.js' ),
      accum= require( './accum.js')

const proto = {
  basename:'delay',

  gen() {
    let inputs = gen.getInputs( this )
    
    gen.memo[ this.name ] = inputs[0]
    
    return inputs[0]
  },
}

const defaults = { size: 512, feedback:0, interp:'none' }

module.exports = ( in1, taps, properties ) => {
  let ugen = Object.create( proto ),
      writeIdx, readIdx, delaydata

  if( Array.isArray( taps ) === false ) taps = [ taps ]
  
  let props = Object.assign( {}, defaults, properties )

  if( props.size < Math.max( ...taps ) ) props.size = Math.max( ...taps )

  delaydata = data( props.size )
  
  ugen.inputs = []

  writeIdx = accum( 1, 0, { max:props.size }) 
  
  for( let i = 0; i < taps.length; i++ ) {
    ugen.inputs[ i ] = peek( delaydata, wrap( sub( writeIdx, taps[i] ), 0, props.size ),{ mode:'samples', interp:props.interp })
  }
  
  ugen.outputs = ugen.inputs // ugn, Ugh, UGH! but i guess it works.

  poke( delaydata, in1, writeIdx )

  ugen.name = `${ugen.basename}${gen.getUID()}`

  return ugen
}

},{"./accum.js":68,"./data.js":84,"./gen.js":96,"./peek.js":120,"./poke.js":122,"./sub.js":131,"./wrap.js":139}],88:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' )

module.exports = ( in1 ) => {
  let n1 = history()
    
  n1.in( in1 )

  let ugen = sub( in1, n1.out )
  ugen.name = 'delta'+gen.getUID()

  return ugen
}

},{"./gen.js":96,"./history.js":100,"./sub.js":131}],89:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

const proto = {
  basename:'div',
  gen() {
    let inputs = gen.getInputs( this ),
        out=`  var ${this.name} = `,
        diff = 0, 
        numCount = 0,
        lastNumber = inputs[ 0 ],
        lastNumberIsUgen = isNaN( lastNumber ), 
        divAtEnd = false

    inputs.forEach( (v,i) => {
      if( i === 0 ) return

      let isNumberUgen = isNaN( v ),
        isFinalIdx   = i === inputs.length - 1

      if( !lastNumberIsUgen && !isNumberUgen ) {
        lastNumber = lastNumber / v
        out += lastNumber
      }else{
        out += `${lastNumber} / ${v}`
      }

      if( !isFinalIdx ) out += ' / ' 
    })

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = (...args) => {
  const div = Object.create( proto )
  
  Object.assign( div, {
    id:     gen.getUID(),
    inputs: args,
  })

  div.name = div.basename + div.id
  
  return div
}

},{"./gen.js":96}],90:[function(require,module,exports){
'use strict'

let gen     = require( './gen' ),
    windows = require( './windows' ),
    data    = require( './data' ),
    peek    = require( './peek' ),
    phasor  = require( './phasor' ),
    defaults = {
      type:'triangular', length:1024, alpha:.15, shift:0, reverse:false 
    }

module.exports = props => {
  
  let properties = Object.assign( {}, defaults, props )
  let buffer = new Float32Array( properties.length )

  let name = properties.type + '_' + properties.length + '_' + properties.shift + '_' + properties.reverse + '_' + properties.alpha
  if( typeof gen.globals.windows[ name ] === 'undefined' ) { 

    for( let i = 0; i < properties.length; i++ ) {
      buffer[ i ] = windows[ properties.type ]( properties.length, i, properties.alpha, properties.shift )
    }

    if( properties.reverse === true ) { 
      buffer.reverse()
    }
    gen.globals.windows[ name ] = data( buffer )
  }

  let ugen = gen.globals.windows[ name ] 
  ugen.name = 'env' + gen.getUID()

  return ugen
}

},{"./data":84,"./gen":96,"./peek":120,"./phasor":121,"./windows":138}],91:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'eq',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = this.inputs[0] === this.inputs[1] ? 1 : `  var ${this.name} = (${inputs[0]} === ${inputs[1]}) | 0\n\n`

    gen.memo[ this.name ] = `${this.name}`

    return [ `${this.name}`, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],92:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'exp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.exp })

      out = `gen.exp( ${inputs[0]} )`

    } else {
      out = Math.exp( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let exp = Object.create( proto )

  exp.inputs = [ x ]

  return exp
}

},{"./gen.js":96}],93:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'floor',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      //gen.closures.add({ [ this.name ]: Math.floor })

      out = `( ${inputs[0]} | 0 )`

    } else {
      out = inputs[0] | 0
    }
    
    return out
  }
}

module.exports = x => {
  let floor = Object.create( proto )

  floor.inputs = [ x ]

  return floor
}

},{"./gen.js":96}],94:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'fold',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        out

    out = this.createCallback( inputs[0], this.min, this.max ) 

    gen.memo[ this.name ] = this.name + '_value'

    return [ this.name + '_value', out ]
  },

  createCallback( v, lo, hi ) {
    let out =
` var ${this.name}_value = ${v},
      ${this.name}_range = ${hi} - ${lo},
      ${this.name}_numWraps = 0

  if(${this.name}_value >= ${hi}){
    ${this.name}_value -= ${this.name}_range
    if(${this.name}_value >= ${hi}){
      ${this.name}_numWraps = ((${this.name}_value - ${lo}) / ${this.name}_range) | 0
      ${this.name}_value -= ${this.name}_range * ${this.name}_numWraps
    }
    ${this.name}_numWraps++
  } else if(${this.name}_value < ${lo}){
    ${this.name}_value += ${this.name}_range
    if(${this.name}_value < ${lo}){
      ${this.name}_numWraps = ((${this.name}_value - ${lo}) / ${this.name}_range- 1) | 0
      ${this.name}_value -= ${this.name}_range * ${this.name}_numWraps
    }
    ${this.name}_numWraps--
  }
  if(${this.name}_numWraps & 1) ${this.name}_value = ${hi} + ${lo} - ${this.name}_value
`
    return ' ' + out
  }
}

module.exports = ( in1, min=0, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],95:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'gate',
  controlString:null, // insert into output codegen for determining indexing
  gen() {
    let inputs = gen.getInputs( this ), out
    
    gen.requestMemory( this.memory )
    
    let lastInputMemoryIdx = 'memory[ ' + this.memory.lastInput.idx + ' ]',
        outputMemoryStartIdx = this.memory.lastInput.idx + 1,
        inputSignal = inputs[0],
        controlSignal = inputs[1]
    
    /* 
     * we check to see if the current control inputs equals our last input
     * if so, we store the signal input in the memory associated with the currently
     * selected index. If not, we put 0 in the memory associated with the last selected index,
     * change the selected index, and then store the signal in put in the memery assoicated
     * with the newly selected index
     */
    
    out =

` if( ${controlSignal} !== ${lastInputMemoryIdx} ) {
    memory[ ${lastInputMemoryIdx} + ${outputMemoryStartIdx}  ] = 0 
    ${lastInputMemoryIdx} = ${controlSignal}
  }
  memory[ ${outputMemoryStartIdx} + ${controlSignal} ] = ${inputSignal}

`
    this.controlString = inputs[1]
    this.initialized = true

    gen.memo[ this.name ] = this.name

    this.outputs.forEach( v => v.gen() )

    return [ null, ' ' + out ]
  },

  childgen() {
    if( this.parent.initialized === false ) {
      gen.getInputs( this ) // parent gate is only input of a gate output, should only be gen'd once.
    }

    if( gen.memo[ this.name ] === undefined ) {
      gen.requestMemory( this.memory )

      gen.memo[ this.name ] = `memory[ ${this.memory.value.idx} ]`
    }
    
    return  `memory[ ${this.memory.value.idx} ]`
  }
}

module.exports = ( control, in1, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { count: 2 }

  if( typeof properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, {
    outputs: [],
    uid:     gen.getUID(),
    inputs:  [ in1, control ],
    memory: {
      lastInput: { length:1, idx:null }
    },
    initialized:false
  },
  defaults )
  
  ugen.name = `${ugen.basename}${gen.getUID()}`

  for( let i = 0; i < ugen.count; i++ ) {
    ugen.outputs.push({
      index:i,
      gen: proto.childgen,
      parent:ugen,
      inputs: [ ugen ],
      memory: {
        value: { length:1, idx:null }
      },
      initialized:false,
      name: `${ugen.name}_out${gen.getUID()}`
    })
  }

  return ugen
}

},{"./gen.js":96}],96:[function(require,module,exports){
'use strict'

/* gen.js
 *
 * low-level code generation for unit generators
 *
 */

let MemoryHelper = require( 'memory-helper' )

let gen = {

  accum:0,
  getUID() { return this.accum++ },
  debug:false,
  samplerate: 44100, // change on audiocontext creation
  shouldLocalize: false,
  globals:{
    windows: {},
  },
  
  /* closures
   *
   * Functions that are included as arguments to master callback. Examples: Math.abs, Math.random etc.
   * XXX Should probably be renamed callbackProperties or something similar... closures are no longer used.
   */

  closures: new Set(),
  params:   new Set(),

  parameters:[],
  endBlock: new Set(),
  histories: new Map(),

  memo: {},

  data: {},
  
  /* export
   *
   * place gen functions into another object for easier reference
   */

  export( obj ) {},

  addToEndBlock( v ) {
    this.endBlock.add( '  ' + v )
  },
  
  requestMemory( memorySpec, immutable=false ) {
    for( let key in memorySpec ) {
      let request = memorySpec[ key ]

      request.idx = gen.memory.alloc( request.length, immutable )
    }
  },

  /* createCallback
   *
   * param ugen - Head of graph to be codegen'd
   *
   * Generate callback function for a particular ugen graph.
   * The gen.closures property stores functions that need to be
   * passed as arguments to the final function; these are prefixed
   * before any defined params the graph exposes. For example, given:
   *
   * gen.createCallback( abs( param() ) )
   *
   * ... the generated function will have a signature of ( abs, p0 ).
   */
  
  createCallback( ugen, mem, debug = false, shouldInlineMemory=false ) {
    let isStereo = Array.isArray( ugen ) && ugen.length > 1,
        callback, 
        channel1, channel2

    if( typeof mem === 'number' || mem === undefined ) {
      mem = MemoryHelper.create( mem )
    }
    
    //console.log( 'cb memory:', mem )
    this.memory = mem
    this.memo = {} 
    this.endBlock.clear()
    this.closures.clear()
    this.params.clear()
    //this.globals = { windows:{} }
    
    this.parameters.length = 0
    
    this.functionBody = "  'use strict'\n"
    if( shouldInlineMemory===false ) this.functionBody += "  var memory = gen.memory\n\n" 

    // call .gen() on the head of the graph we are generating the callback for
    //console.log( 'HEAD', ugen )
    for( let i = 0; i < 1 + isStereo; i++ ) {
      if( typeof ugen[i] === 'number' ) continue

      //let channel = isStereo ? ugen[i].gen() : ugen.gen(),
      let channel = isStereo ? this.getInput( ugen[i] ) : this.getInput( ugen ), 
          body = ''

      // if .gen() returns array, add ugen callback (graphOutput[1]) to our output functions body
      // and then return name of ugen. If .gen() only generates a number (for really simple graphs)
      // just return that number (graphOutput[0]).
      body += Array.isArray( channel ) ? channel[1] + '\n' + channel[0] : channel

      // split body to inject return keyword on last line
      body = body.split('\n')
     
      //if( debug ) console.log( 'functionBody length', body )
      
      // next line is to accommodate memo as graph head
      if( body[ body.length -1 ].trim().indexOf('let') > -1 ) { body.push( '\n' ) } 

      // get index of last line
      let lastidx = body.length - 1

      // insert return keyword
      body[ lastidx ] = '  gen.out[' + i + ']  = ' + body[ lastidx ] + '\n'

      this.functionBody += body.join('\n')
    }
    
    this.histories.forEach( value => {
      if( value !== null )
        value.gen()      
    })

    let returnStatement = isStereo ? '  return gen.out' : '  return gen.out[0]'
    
    this.functionBody = this.functionBody.split('\n')

    if( this.endBlock.size ) { 
      this.functionBody = this.functionBody.concat( Array.from( this.endBlock ) )
      this.functionBody.push( returnStatement )
    }else{
      this.functionBody.push( returnStatement )
    }
    // reassemble function body
    this.functionBody = this.functionBody.join('\n')

    // we can only dynamically create a named function by dynamically creating another function
    // to construct the named function! sheesh...
    //
    if( shouldInlineMemory === true ) {
      this.parameters.push( 'memory' )
    }
    let buildString = `return function gen( ${ this.parameters.join(',') } ){ \n${ this.functionBody }\n}`
    
    if( this.debug || debug ) console.log( buildString ) 

    callback = new Function( buildString )()

    
    // assign properties to named function
    for( let dict of this.closures.values() ) {
      let name = Object.keys( dict )[0],
          value = dict[ name ]

      callback[ name ] = value
    }

    for( let dict of this.params.values() ) {
      let name = Object.keys( dict )[0],
          ugen = dict[ name ]
      
      Object.defineProperty( callback, name, {
        configurable: true,
        get() { return ugen.value },
        set(v){ ugen.value = v }
      })
      //callback[ name ] = value
    }

    callback.data = this.data
    callback.out  = new Float32Array( 2 )
    callback.parameters = this.parameters.slice( 0 )

    //if( MemoryHelper.isPrototypeOf( this.memory ) ) 
    callback.memory = this.memory.heap

    this.histories.clear()

    return callback
  },
  
  /* getInputs
   *
   * Called by each individual ugen when their .gen() method is called to resolve their various inputs.
   * If an input is a number, return the number. If
   * it is an ugen, call .gen() on the ugen, memoize the result and return the result. If the
   * ugen has previously been memoized return the memoized value.
   *
   */
  getInputs( ugen ) {
    return ugen.inputs.map( gen.getInput ) 
  },

  getInput( input ) {
    let isObject = typeof input === 'object',
        processedInput

    if( isObject ) { // if input is a ugen... 
      //console.log( input.name, gen.memo[ input.name ] )
      if( gen.memo[ input.name ] ) { // if it has been memoized...
        processedInput = gen.memo[ input.name ]
      }else if( Array.isArray( input ) ) {
        gen.getInput( input[0] )
        gen.getInput( input[1] )
      }else{ // if not memoized generate code  
        if( typeof input.gen !== 'function' ) {
          console.log( 'no gen found:', input, input.gen )
        }
        let code = input.gen()
        //if( code.indexOf( 'Object' ) > -1 ) console.log( 'bad input:', input, code )
        
        if( Array.isArray( code ) ) {
          if( !gen.shouldLocalize ) {
            gen.functionBody += code[1]
          }else{
            gen.codeName = code[0]
            gen.localizedCode.push( code[1] )
          }
          //console.log( 'after GEN' , this.functionBody )
          processedInput = code[0]
        }else{
          processedInput = code
        }
      }
    }else{ // it input is a number
      processedInput = input
    }

    return processedInput
  },

  startLocalize() {
    this.localizedCode = []
    this.shouldLocalize = true
  },
  endLocalize() {
    this.shouldLocalize = false

    return [ this.codeName, this.localizedCode.slice(0) ]
  },

  free( graph ) {
    if( Array.isArray( graph ) ) { // stereo ugen
      for( let channel of graph ) {
        this.free( channel )
      }
    } else {
      if( typeof graph === 'object' ) {
        if( graph.memory !== undefined ) {
          for( let memoryKey in graph.memory ) {
            this.memory.free( graph.memory[ memoryKey ].idx )
          }
        }
        if( Array.isArray( graph.inputs ) ) {
          for( let ugen of graph.inputs ) {
            this.free( ugen )
          }
        }
      }
    }
  }
}

module.exports = gen

},{"memory-helper":141}],97:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'gt',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `(( ${inputs[0]} > ${inputs[1]}) | 0 )`
    } else {
      out += inputs[0] > inputs[1] ? 1 : 0 
    }
    out += '\n\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let gt = Object.create( proto )

  gt.inputs = [ x,y ]
  gt.name = 'gt'+gen.getUID()

  return gt
}

},{"./gen.js":96}],98:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  name:'gte',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `( ${inputs[0]} >= ${inputs[1]} | 0 )`
    } else {
      out += inputs[0] >= inputs[1] ? 1 : 0 
    }
    out += '\n\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
  }
}

module.exports = (x,y) => {
  let gt = Object.create( proto )

  gt.inputs = [ x,y ]
  gt.name = 'gte' + gen.getUID()

  return gt
}

},{"./gen.js":96}],99:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'gtp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out = `(${inputs[ 0 ]} * ( ( ${inputs[0]} > ${inputs[1]} ) | 0 ) )` 
    } else {
      out = inputs[0] * ( ( inputs[0] > inputs[1] ) | 0 )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let gtp = Object.create( proto )

  gtp.inputs = [ x,y ]

  return gtp
}

},{"./gen.js":96}],100:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

module.exports = ( in1=0 ) => {
  let ugen = {
    inputs: [ in1 ],
    memory: { value: { length:1, idx: null } },
    recorder: null,

    in( v ) {
      if( gen.histories.has( v ) ){
        let memoHistory = gen.histories.get( v )
        ugen.name = memoHistory.name
        return memoHistory
      }

      let obj = {
        gen() {
          let inputs = gen.getInputs( ugen )

          if( ugen.memory.value.idx === null ) {
            gen.requestMemory( ugen.memory )
            gen.memory.heap[ ugen.memory.value.idx ] = in1
          }

          let idx = ugen.memory.value.idx
          
          gen.addToEndBlock( 'memory[ ' + idx + ' ] = ' + inputs[ 0 ] )
          
          // return ugen that is being recorded instead of ssd.
          // this effectively makes a call to ssd.record() transparent to the graph.
          // recording is triggered by prior call to gen.addToEndBlock.
          gen.histories.set( v, obj )

          return inputs[ 0 ]
        },
        name: ugen.name + '_in'+gen.getUID(),
        memory: ugen.memory
      }

      this.inputs[ 0 ] = v
      
      ugen.recorder = obj

      return obj
    },
    
    out: {
            
      gen() {
        if( ugen.memory.value.idx === null ) {
          if( gen.histories.get( ugen.inputs[0] ) === undefined ) {
            gen.histories.set( ugen.inputs[0], ugen.recorder )
          }
          gen.requestMemory( ugen.memory )
          gen.memory.heap[ ugen.memory.value.idx ] = parseFloat( in1 )
        }
        let idx = ugen.memory.value.idx
         
        return 'memory[ ' + idx + ' ] '
      },
    },

    uid: gen.getUID(),
  }
  
  ugen.out.memory = ugen.memory 

  ugen.name = 'history' + ugen.uid
  ugen.out.name = ugen.name + '_out'
  ugen.in._name  = ugen.name = '_in'

  Object.defineProperty( ugen, 'value', {
    get() {
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        gen.memory.heap[ this.memory.value.idx ] = v 
      }
    }
  })

  return ugen
}

},{"./gen.js":96}],101:[function(require,module,exports){
/*

 a = conditional( condition, trueBlock, falseBlock )
 b = conditional([
   condition1, block1,
   condition2, block2,
   condition3, block3,
   defaultBlock
 ])

*/
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'ifelse',

  gen() {
    let conditionals = this.inputs[0],
        defaultValue = gen.getInput( conditionals[ conditionals.length - 1] ),
        out = `  var ${this.name}_out = ${defaultValue}\n` 

    //console.log( 'defaultValue:', defaultValue )

    for( let i = 0; i < conditionals.length - 2; i+= 2 ) {
      let isEndBlock = i === conditionals.length - 3,
          cond  = gen.getInput( conditionals[ i ] ),
          preblock = conditionals[ i+1 ],
          block, blockName, output

      //console.log( 'pb', preblock )

      if( typeof preblock === 'number' ){
        block = preblock
        blockName = null
      }else{
        if( gen.memo[ preblock.name ] === undefined ) {
          // used to place all code dependencies in appropriate blocks
          gen.startLocalize()

          gen.getInput( preblock )

          block = gen.endLocalize()
          blockName = block[0]
          block = block[ 1 ].join('')
          block = '  ' + block.replace( /\n/gi, '\n  ' )
        }else{
          block = ''
          blockName = gen.memo[ preblock.name ]
        }
      }

      output = blockName === null ? 
        `  ${this.name}_out = ${block}` :
        `${block}  ${this.name}_out = ${blockName}`
      
      if( i===0 ) out += ' '
      out += 
` if( ${cond} === 1 ) {
${output}
  }`

if( !isEndBlock ) {
  out += ` else`
}else{
  out += `\n`
}
/*         
 else`
      }else if( isEndBlock ) {
        out += `{\n  ${output}\n  }\n`
      }else {

        //if( i + 2 === conditionals.length || i === conditionals.length - 1 ) {
        //  out += `{\n  ${output}\n  }\n`
        //}else{
          out += 
` if( ${cond} === 1 ) {
${output}
  } else `
        //}
      }*/
    }

    gen.memo[ this.name ] = `${this.name}_out`

    return [ `${this.name}_out`, out ]
  }
}

module.exports = ( ...args  ) => {
  let ugen = Object.create( proto ),
      conditions = Array.isArray( args[0] ) ? args[0] : args

  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ conditions ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],102:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename:'in',

  gen() {
    gen.parameters.push( this.name )
    
    gen.memo[ this.name ] = this.name

    return this.name
  } 
}

module.exports = ( name ) => {
  let input = Object.create( proto )

  input.id   = gen.getUID()
  input.name = name !== undefined ? name : `${input.basename}${input.id}`
  input[0] = {
    gen() {
      if( ! gen.parameters.includes( input.name ) ) gen.parameters.push( input.name )
      return input.name + '[0]'
    }
  }
  input[1] = {
    gen() {
      if( ! gen.parameters.includes( input.name ) ) gen.parameters.push( input.name )
      return input.name + '[1]'
    }
  }


  return input
}

},{"./gen.js":96}],103:[function(require,module,exports){
'use strict'

let library = {
  export( destination ) {
    if( destination === window ) {
      destination.ssd = library.history    // history is window object property, so use ssd as alias
      destination.input = library.in       // in is a keyword in javascript
      destination.ternary = library.switch // switch is a keyword in javascript

      delete library.history
      delete library.in
      delete library.switch
    }

    Object.assign( destination, library )

    Object.defineProperty( library, 'samplerate', {
      get() { return library.gen.samplerate },
      set(v) {}
    })

    library.in = destination.input
    library.history = destination.ssd
    library.switch = destination.ternary

    destination.clip = library.clamp
  },

  gen:      require( './gen.js' ),
  
  abs:      require( './abs.js' ),
  round:    require( './round.js' ),
  param:    require( './param.js' ),
  add:      require( './add.js' ),
  sub:      require( './sub.js' ),
  mul:      require( './mul.js' ),
  div:      require( './div.js' ),
  accum:    require( './accum.js' ),
  counter:  require( './counter.js' ),
  sin:      require( './sin.js' ),
  cos:      require( './cos.js' ),
  tan:      require( './tan.js' ),
  tanh:     require( './tanh.js' ),
  asin:     require( './asin.js' ),
  acos:     require( './acos.js' ),
  atan:     require( './atan.js' ),  
  phasor:   require( './phasor.js' ),
  data:     require( './data.js' ),
  peek:     require( './peek.js' ),
  cycle:    require( './cycle.js' ),
  history:  require( './history.js' ),
  delta:    require( './delta.js' ),
  floor:    require( './floor.js' ),
  ceil:     require( './ceil.js' ),
  min:      require( './min.js' ),
  max:      require( './max.js' ),
  sign:     require( './sign.js' ),
  dcblock:  require( './dcblock.js' ),
  memo:     require( './memo.js' ),
  rate:     require( './rate.js' ),
  wrap:     require( './wrap.js' ),
  mix:      require( './mix.js' ),
  clamp:    require( './clamp.js' ),
  poke:     require( './poke.js' ),
  delay:    require( './delay.js' ),
  fold:     require( './fold.js' ),
  mod :     require( './mod.js' ),
  sah :     require( './sah.js' ),
  noise:    require( './noise.js' ),
  not:      require( './not.js' ),
  gt:       require( './gt.js' ),
  gte:      require( './gte.js' ),
  lt:       require( './lt.js' ), 
  lte:      require( './lte.js' ), 
  bool:     require( './bool.js' ),
  gate:     require( './gate.js' ),
  train:    require( './train.js' ),
  slide:    require( './slide.js' ),
  in:       require( './in.js' ),
  t60:      require( './t60.js'),
  mtof:     require( './mtof.js'),
  ltp:      require( './ltp.js'),        // TODO: test
  gtp:      require( './gtp.js'),        // TODO: test
  switch:   require( './switch.js' ),
  mstosamps:require( './mstosamps.js' ), // TODO: needs test,
  selector: require( './selector.js' ),
  utilities:require( './utilities.js' ),
  pow:      require( './pow.js' ),
  attack:   require( './attack.js' ),
  decay:    require( './decay.js' ),
  windows:  require( './windows.js' ),
  env:      require( './env.js' ),
  ad:       require( './ad.js'  ),
  adsr:     require( './adsr.js' ),
  ifelse:   require( './ifelseif.js' ),
  bang:     require( './bang.js' ),
  and:      require( './and.js' ),
  pan:      require( './pan.js' ),
  eq:       require( './eq.js' ),
  neq:      require( './neq.js' ),
  exp:      require( './exp.js' )
}

library.gen.lib = library

module.exports = library

},{"./abs.js":67,"./accum.js":68,"./acos.js":69,"./ad.js":70,"./add.js":71,"./adsr.js":72,"./and.js":73,"./asin.js":74,"./atan.js":75,"./attack.js":76,"./bang.js":77,"./bool.js":78,"./ceil.js":79,"./clamp.js":80,"./cos.js":81,"./counter.js":82,"./cycle.js":83,"./data.js":84,"./dcblock.js":85,"./decay.js":86,"./delay.js":87,"./delta.js":88,"./div.js":89,"./env.js":90,"./eq.js":91,"./exp.js":92,"./floor.js":93,"./fold.js":94,"./gate.js":95,"./gen.js":96,"./gt.js":97,"./gte.js":98,"./gtp.js":99,"./history.js":100,"./ifelseif.js":101,"./in.js":102,"./lt.js":104,"./lte.js":105,"./ltp.js":106,"./max.js":107,"./memo.js":108,"./min.js":109,"./mix.js":110,"./mod.js":111,"./mstosamps.js":112,"./mtof.js":113,"./mul.js":114,"./neq.js":115,"./noise.js":116,"./not.js":117,"./pan.js":118,"./param.js":119,"./peek.js":120,"./phasor.js":121,"./poke.js":122,"./pow.js":123,"./rate.js":124,"./round.js":125,"./sah.js":126,"./selector.js":127,"./sign.js":128,"./sin.js":129,"./slide.js":130,"./sub.js":131,"./switch.js":132,"./t60.js":133,"./tan.js":134,"./tanh.js":135,"./train.js":136,"./utilities.js":137,"./windows.js":138,"./wrap.js":139}],104:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'lt',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `(( ${inputs[0]} < ${inputs[1]}) | 0  )`
    } else {
      out += inputs[0] < inputs[1] ? 1 : 0 
    }
    out += '\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
    
    return out
  }
}

module.exports = (x,y) => {
  let lt = Object.create( proto )

  lt.inputs = [ x,y ]
  lt.name = 'lt' + gen.getUID()

  return lt
}

},{"./gen.js":96}],105:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'lte',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    out = `  var ${this.name} = `  

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out += `( ${inputs[0]} <= ${inputs[1]} | 0  )`
    } else {
      out += inputs[0] <= inputs[1] ? 1 : 0 
    }
    out += '\n'

    gen.memo[ this.name ] = this.name

    return [this.name, out]
    
    return out
  }
}

module.exports = (x,y) => {
  let lt = Object.create( proto )

  lt.inputs = [ x,y ]
  lt.name = 'lte' + gen.getUID()

  return lt
}

},{"./gen.js":96}],106:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'ltp',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) || isNaN( this.inputs[1] ) ) {
      out = `(${inputs[ 0 ]} * (( ${inputs[0]} < ${inputs[1]} ) | 0 ) )` 
    } else {
      out = inputs[0] * (( inputs[0] < inputs[1] ) | 0 )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let ltp = Object.create( proto )

  ltp.inputs = [ x,y ]

  return ltp
}

},{"./gen.js":96}],107:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'max',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ [ this.name ]: Math.max })

      out = `gen.max( ${inputs[0]}, ${inputs[1]} )`

    } else {
      out = Math.max( parseFloat( inputs[0] ), parseFloat( inputs[1] ) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let max = Object.create( proto )

  max.inputs = [ x,y ]

  return max
}

},{"./gen.js":96}],108:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename:'memo',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    out = `  var ${this.name} = ${inputs[0]}\n`

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  } 
}

module.exports = (in1,memoName) => {
  let memo = Object.create( proto )
  
  memo.inputs = [ in1 ]
  memo.id   = gen.getUID()
  memo.name = memoName !== undefined ? memoName + '_' + gen.getUID() : `${memo.basename}${memo.id}`

  return memo
}

},{"./gen.js":96}],109:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'min',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ [ this.name ]: Math.min })

      out = `gen.min( ${inputs[0]}, ${inputs[1]} )`

    } else {
      out = Math.min( parseFloat( inputs[0] ), parseFloat( inputs[1] ) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let min = Object.create( proto )

  min.inputs = [ x,y ]

  return min
}

},{"./gen.js":96}],110:[function(require,module,exports){
'use strict'

let gen = require('./gen.js'),
    add = require('./add.js'),
    mul = require('./mul.js'),
    sub = require('./sub.js'),
    memo= require('./memo.js')

module.exports = ( in1, in2, t=.5 ) => {
  let ugen = memo( add( mul(in1, sub(1,t ) ), mul( in2, t ) ) )
  ugen.name = 'mix' + gen.getUID()

  return ugen
}

},{"./add.js":71,"./gen.js":96,"./memo.js":108,"./mul.js":114,"./sub.js":131}],111:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

module.exports = (...args) => {
  let mod = {
    id:     gen.getUID(),
    inputs: args,

    gen() {
      let inputs = gen.getInputs( this ),
          out='(',
          diff = 0, 
          numCount = 0,
          lastNumber = inputs[ 0 ],
          lastNumberIsUgen = isNaN( lastNumber ), 
          modAtEnd = false

      inputs.forEach( (v,i) => {
        if( i === 0 ) return

        let isNumberUgen = isNaN( v ),
            isFinalIdx   = i === inputs.length - 1

        if( !lastNumberIsUgen && !isNumberUgen ) {
          lastNumber = lastNumber % v
          out += lastNumber
        }else{
          out += `${lastNumber} % ${v}`
        }

        if( !isFinalIdx ) out += ' % ' 
      })

      out += ')'

      return out
    }
  }
  
  return mod
}

},{"./gen.js":96}],112:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'mstosamps',

  gen() {
    let out,
        inputs = gen.getInputs( this ),
        returnValue

    if( isNaN( inputs[0] ) ) {
      out = `  var ${this.name } = ${gen.samplerate} / 1000 * ${inputs[0]} \n\n`
     
      gen.memo[ this.name ] = out
      
      returnValue = [ this.name, out ]
    } else {
      out = gen.samplerate / 1000 * this.inputs[0]

      returnValue = out
    }    

    return returnValue
  }
}

module.exports = x => {
  let mstosamps = Object.create( proto )

  mstosamps.inputs = [ x ]
  mstosamps.name = proto.basename + gen.getUID()

  return mstosamps
}

},{"./gen.js":96}],113:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'mtof',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.exp })

      out = `( ${this.tuning} * gen.exp( .057762265 * (${inputs[0]} - 69) ) )`

    } else {
      out = this.tuning * Math.exp( .057762265 * ( inputs[0] - 69) )
    }
    
    return out
  }
}

module.exports = ( x, props ) => {
  let ugen = Object.create( proto ),
      defaults = { tuning:440 }
  
  if( props !== undefined ) Object.assign( props.defaults )

  Object.assign( ugen, defaults )
  ugen.inputs = [ x ]
  

  return ugen
}

},{"./gen.js":96}],114:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = {
  basename: 'mul',

  gen() {
    let inputs = gen.getInputs( this ),
        out = `  var ${this.name} = `,
        sum = 1, numCount = 0, mulAtEnd = false, alreadyFullSummed = true

    inputs.forEach( (v,i) => {
      if( isNaN( v ) ) {
        out += v
        if( i < inputs.length -1 ) {
          mulAtEnd = true
          out += ' * '
        }
        alreadyFullSummed = false
      }else{
        if( i === 0 ) {
          sum = v
        }else{
          sum *= parseFloat( v )
        }
        numCount++
      }
    })

    if( numCount > 0 ) {
      out += mulAtEnd || alreadyFullSummed ? sum : ' * ' + sum
    }

    out += '\n'

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = ( ...args ) => {
  const mul = Object.create( proto )
  
  Object.assign( mul, {
      id:     gen.getUID(),
      inputs: args,
  })
  
  mul.name = mul.basename + mul.id

  return mul
}

},{"./gen.js":96}],115:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'neq',

  gen() {
    let inputs = gen.getInputs( this ), out

    out = /*this.inputs[0] !== this.inputs[1] ? 1 :*/ `  var ${this.name} = (${inputs[0]} !== ${inputs[1]}) | 0\n\n`

    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  },

}

module.exports = ( in1, in2 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],116:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'noise',

  gen() {
    let out

    gen.closures.add({ 'noise' : Math.random })

    out = `  var ${this.name} = gen.noise()\n`
    
    gen.memo[ this.name ] = this.name

    return [ this.name, out ]
  }
}

module.exports = x => {
  let noise = Object.create( proto )
  noise.name = proto.name + gen.getUID()

  return noise
}

},{"./gen.js":96}],117:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'not',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( this.inputs[0] ) ) {
      out = `( ${inputs[0]} === 0 ? 1 : 0 )`
    } else {
      out = !inputs[0] === 0 ? 1 : 0
    }
    
    return out
  }
}

module.exports = x => {
  let not = Object.create( proto )

  not.inputs = [ x ]

  return not
}

},{"./gen.js":96}],118:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' ),
    data = require( './data.js' ),
    peek = require( './peek.js' ),
    mul  = require( './mul.js' )

let proto = {
  basename:'pan', 
  initTable() {    
    let bufferL = new Float32Array( 1024 ),
        bufferR = new Float32Array( 1024 )

    const angToRad = Math.PI / 180
    for( let i = 0; i < 1024; i++ ) { 
      let pan = i * ( 90 / 1024 )
      bufferL[i] = Math.cos( pan * angToRad ) 
      bufferR[i] = Math.sin( pan * angToRad )
    }

    gen.globals.panL = data( bufferL, 1, { immutable:true })
    gen.globals.panR = data( bufferR, 1, { immutable:true })
  }

}

module.exports = ( leftInput, rightInput, pan =.5, properties ) => {
  if( gen.globals.panL === undefined ) proto.initTable()

  let ugen = Object.create( proto )

  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ leftInput, rightInput ],
    left:    mul( leftInput, peek( gen.globals.panL, pan, { boundmode:'clamp' }) ),
    right:   mul( rightInput, peek( gen.globals.panR, pan, { boundmode:'clamp' }) )
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./data.js":84,"./gen.js":96,"./mul.js":114,"./peek.js":120}],119:[function(require,module,exports){
'use strict'

let gen = require('./gen.js')

let proto = {
  basename: 'param',

  gen() {
    gen.requestMemory( this.memory )
    
    gen.params.add({ [this.name]: this })

    this.value = this.initialValue

    gen.memo[ this.name ] = `memory[${this.memory.value.idx}]`

    return gen.memo[ this.name ]
  } 
}

module.exports = ( propName=0, value=0 ) => {
  let ugen = Object.create( proto )
  
  if( typeof propName !== 'string' ) {
    ugen.name = ugen.basename + gen.getUID()
    ugen.initialValue = propName
  }else{
    ugen.name = propName
    ugen.initialValue = value
  }

  Object.defineProperty( ugen, 'value', {
    get() {
      if( this.memory.value.idx !== null ) {
        return gen.memory.heap[ this.memory.value.idx ]
      }
    },
    set( v ) {
      if( this.memory.value.idx !== null ) {
        gen.memory.heap[ this.memory.value.idx ] = v 
      }
    }
  })

  ugen.memory = {
    value: { length:1, idx:null }
  }

  return ugen
}

},{"./gen.js":96}],120:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'peek',

  gen() {
    let genName = 'gen.' + this.name,
        inputs = gen.getInputs( this ),
        out, functionBody, next, lengthIsLog2, idx
    
    idx = inputs[1]
    lengthIsLog2 = (Math.log2( this.data.buffer.length ) | 0)  === Math.log2( this.data.buffer.length )

    if( this.mode !== 'simple' ) {

    functionBody = `  var ${this.name}_dataIdx  = ${idx}, 
      ${this.name}_phase = ${this.mode === 'samples' ? inputs[0] : inputs[0] + ' * ' + (this.data.buffer.length - 1) }, 
      ${this.name}_index = ${this.name}_phase | 0,\n`

    if( this.boundmode === 'wrap' ) {
      next = lengthIsLog2 ?
      `( ${this.name}_index + 1 ) & (${this.data.buffer.length} - 1)` :
      `${this.name}_index + 1 >= ${this.data.buffer.length} ? ${this.name}_index + 1 - ${this.data.buffer.length} : ${this.name}_index + 1`
    }else if( this.boundmode === 'clamp' ) {
      next = 
        `${this.name}_index + 1 >= ${this.data.buffer.length - 1} ? ${this.data.buffer.length - 1} : ${this.name}_index + 1`
    } else if( this.boundmode === 'fold' || this.boundmode === 'mirror' ) {
      next = 
        `${this.name}_index + 1 >= ${this.data.buffer.length - 1} ? ${this.name}_index - ${this.data.buffer.length - 1} : ${this.name}_index + 1`
    }else{
       next = 
      `${this.name}_index + 1`     
    }

    if( this.interp === 'linear' ) {      
    functionBody += `      ${this.name}_frac  = ${this.name}_phase - ${this.name}_index,
      ${this.name}_base  = memory[ ${this.name}_dataIdx +  ${this.name}_index ],
      ${this.name}_next  = ${next},`
      
      if( this.boundmode === 'ignore' ) {
        functionBody += `
      ${this.name}_out   = ${this.name}_index >= ${this.data.buffer.length - 1} || ${this.name}_index < 0 ? 0 : ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
      }else{
        functionBody += `
      ${this.name}_out   = ${this.name}_base + ${this.name}_frac * ( memory[ ${this.name}_dataIdx + ${this.name}_next ] - ${this.name}_base )\n\n`
      }
    }else{
      functionBody += `      ${this.name}_out = memory[ ${this.name}_dataIdx + ${this.name}_index ]\n\n`
    }

    } else { // mode is simple
      functionBody = `memory[ ${idx} + ${ inputs[0] } ]`
      
      return functionBody
    }

    gen.memo[ this.name ] = this.name + '_out'

    return [ this.name+'_out', functionBody ]
  },
}

module.exports = ( data, index, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { channels:1, mode:'phase', interp:'linear', boundmode:'wrap' } 
  
  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    data,
    dataName:   data.name,
    uid:        gen.getUID(),
    inputs:     [ index, data ],
  },
  defaults )
  
  ugen.name = ugen.basename + ugen.uid

  return ugen
}

},{"./gen.js":96}],121:[function(require,module,exports){
'use strict'

let gen  = require( './gen.js' ),
    accum= require( './accum.js' ),
    mul  = require( './mul.js' ),
    proto = { basename:'phasor' }

const defaults = { min: -1, max: 1 }

module.exports = ( frequency=1, reset=0, _props ) => {
  const props = Object.assign( {}, defaults, _props )

  let range = props.max - props.min

  let ugen = typeof frequency === 'number' ? accum( (frequency * range) / gen.samplerate, reset, props ) :  accum( mul( frequency, 1/gen.samplerate/(1/range) ), reset, props )

  ugen.name = proto.basename + gen.getUID()

  return ugen
}

},{"./accum.js":68,"./gen.js":96,"./mul.js":114}],122:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    mul  = require('./mul.js'),
    wrap = require('./wrap.js')

let proto = {
  basename:'poke',

  gen() {
    let dataName = 'memory',
        inputs = gen.getInputs( this ),
        idx, out, wrapped
    
    idx = this.data.gen()

    //gen.requestMemory( this.memory )
    //wrapped = wrap( this.inputs[1], 0, this.dataLength ).gen()
    //idx = wrapped[0]
    //gen.functionBody += wrapped[1]
    let outputStr = this.inputs[1] === 0 ?
      `  ${dataName}[ ${idx} ] = ${inputs[0]}\n` :
      `  ${dataName}[ ${idx} + ${inputs[1]} ] = ${inputs[0]}\n`

    if( this.inline === undefined ) {
      gen.functionBody += outputStr
    }else{
      return [ this.inline, outputStr ]
    }
  }
}
module.exports = ( data, value, index, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { channels:1 } 

  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    data,
    dataName:   data.name,
    dataLength: data.buffer.length,
    uid:        gen.getUID(),
    inputs:     [ value, index ],
  },
  defaults )


  ugen.name = ugen.basename + ugen.uid
  
  gen.histories.set( ugen.name, ugen )

  return ugen
}

},{"./gen.js":96,"./mul.js":114,"./wrap.js":139}],123:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'pow',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) || isNaN( inputs[1] ) ) {
      gen.closures.add({ 'pow': Math.pow })

      out = `gen.pow( ${inputs[0]}, ${inputs[1]} )` 

    } else {
      if( typeof inputs[0] === 'string' && inputs[0][0] === '(' ) {
        inputs[0] = inputs[0].slice(1,-1)
      }
      if( typeof inputs[1] === 'string' && inputs[1][0] === '(' ) {
        inputs[1] = inputs[1].slice(1,-1)
      }

      out = Math.pow( parseFloat( inputs[0] ), parseFloat( inputs[1]) )
    }
    
    return out
  }
}

module.exports = (x,y) => {
  let pow = Object.create( proto )

  pow.inputs = [ x,y ]
  pow.id = gen.getUID()
  pow.name = `${pow.basename}{pow.id}`

  return pow
}

},{"./gen.js":96}],124:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' ),
    delta   = require( './delta.js' ),
    wrap    = require( './wrap.js' )

let proto = {
  basename:'rate',

  gen() {
    let inputs = gen.getInputs( this ),
        phase  = history(),
        inMinus1 = history(),
        genName = 'gen.' + this.name,
        filter, sum, out

    gen.closures.add({ [ this.name ]: this }) 

    out = 
` var ${this.name}_diff = ${inputs[0]} - ${genName}.lastSample
  if( ${this.name}_diff < -.5 ) ${this.name}_diff += 1
  ${genName}.phase += ${this.name}_diff * ${inputs[1]}
  if( ${genName}.phase > 1 ) ${genName}.phase -= 1
  ${genName}.lastSample = ${inputs[0]}
`
    out = ' ' + out

    return [ genName + '.phase', out ]
  }
}

module.exports = ( in1, rate ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    phase:      0,
    lastSample: 0,
    uid:        gen.getUID(),
    inputs:     [ in1, rate ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./add.js":71,"./delta.js":88,"./gen.js":96,"./history.js":100,"./memo.js":108,"./mul.js":114,"./sub.js":131,"./wrap.js":139}],125:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'round',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.round })

      out = `gen.round( ${inputs[0]} )`

    } else {
      out = Math.round( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let round = Object.create( proto )

  round.inputs = [ x ]

  return round
}

},{"./gen.js":96}],126:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' )

let proto = {
  basename:'sah',

  gen() {
    let inputs = gen.getInputs( this ), out

    gen.data[ this.name ] = 0
    gen.data[ this.name + '_control' ] = 0

    out = 
` var ${this.name} = gen.data.${this.name}_control,
      ${this.name}_trigger = ${inputs[1]} > ${inputs[2]} ? 1 : 0

  if( ${this.name}_trigger !== ${this.name}  ) {
    if( ${this.name}_trigger === 1 ) 
      gen.data.${this.name} = ${inputs[0]}
    gen.data.${this.name}_control = ${this.name}_trigger
  }
`
    
    gen.memo[ this.name ] = `gen.data.${this.name}`

    return [ `gen.data.${this.name}`, ' ' +out ]
  }
}

module.exports = ( in1, control, threshold=0, properties ) => {
  let ugen = Object.create( proto ),
      defaults = { init:0 }

  if( properties !== undefined ) Object.assign( defaults, properties )

  Object.assign( ugen, { 
    lastSample: 0,
    uid:        gen.getUID(),
    inputs:     [ in1, control,threshold ],
  },
  defaults )
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],127:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'selector',

  gen() {
    let inputs = gen.getInputs( this ), out, returnValue = 0
    
    switch( inputs.length ) {
      case 2 :
        returnValue = inputs[1]
        break;
      case 3 :
        out = `  var ${this.name}_out = ${inputs[0]} === 1 ? ${inputs[1]} : ${inputs[2]}\n\n`;
        returnValue = [ this.name + '_out', out ]
        break;  
      default:
        out = 
` var ${this.name}_out = 0
  switch( ${inputs[0]} + 1 ) {\n`

        for( let i = 1; i < inputs.length; i++ ){
          out +=`    case ${i}: ${this.name}_out = ${inputs[i]}; break;\n` 
        }

        out += '  }\n\n'
        
        returnValue = [ this.name + '_out', ' ' + out ]
    }

    gen.memo[ this.name ] = this.name + '_out'

    return returnValue
  },
}

module.exports = ( ...inputs ) => {
  let ugen = Object.create( proto )
  
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],128:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  name:'sign',

  gen() {
    let out,
        inputs = gen.getInputs( this )

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ this.name ]: Math.sign })

      out = `gen.sign( ${inputs[0]} )`

    } else {
      out = Math.sign( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let sign = Object.create( proto )

  sign.inputs = [ x ]

  return sign
}

},{"./gen.js":96}],129:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'sin',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'sin': Math.sin })

      out = `gen.sin( ${inputs[0]} )` 

    } else {
      out = Math.sin( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let sin = Object.create( proto )

  sin.inputs = [ x ]
  sin.id = gen.getUID()
  sin.name = `${sin.basename}{sin.id}`

  return sin
}

},{"./gen.js":96}],130:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    history = require( './history.js' ),
    sub     = require( './sub.js' ),
    add     = require( './add.js' ),
    mul     = require( './mul.js' ),
    memo    = require( './memo.js' ),
    gt      = require( './gt.js' ),
    div     = require( './div.js' ),
    _switch = require( './switch.js' )

module.exports = ( in1, slideUp = 1, slideDown = 1 ) => {
  let y1 = history(0),
      filter, slideAmount

  //y (n) = y (n-1) + ((x (n) - y (n-1))/slide) 
  slideAmount = _switch( gt(in1,y1.out), slideUp, slideDown )

  filter = memo( add( y1.out, div( sub( in1, y1.out ), slideAmount ) ) )

  y1.in( filter )

  return filter
}

},{"./add.js":71,"./div.js":89,"./gen.js":96,"./gt.js":97,"./history.js":100,"./memo.js":108,"./mul.js":114,"./sub.js":131,"./switch.js":132}],131:[function(require,module,exports){
'use strict'

const gen = require('./gen.js')

const proto = {
  basename:'sub',
  gen() {
    let inputs = gen.getInputs( this ),
        out=0,
        diff = 0,
        needsParens = false, 
        numCount = 0,
        lastNumber = inputs[ 0 ],
        lastNumberIsUgen = isNaN( lastNumber ), 
        subAtEnd = false,
        hasUgens = false,
        returnValue = 0

    this.inputs.forEach( value => { if( isNaN( value ) ) hasUgens = true })

    out = '  var ' + this.name + ' = '

    inputs.forEach( (v,i) => {
      if( i === 0 ) return

      let isNumberUgen = isNaN( v ),
          isFinalIdx   = i === inputs.length - 1

      if( !lastNumberIsUgen && !isNumberUgen ) {
        lastNumber = lastNumber - v
        out += lastNumber
        return
      }else{
        needsParens = true
        out += `${lastNumber} - ${v}`
      }

      if( !isFinalIdx ) out += ' - ' 
    })

    out += '\n'

    returnValue = [ this.name, out ]

    gen.memo[ this.name ] = this.name

    return returnValue
  }

}

module.exports = ( ...args ) => {
  let sub = Object.create( proto )

  Object.assign( sub, {
    id:     gen.getUID(),
    inputs: args
  })
       
  sub.name = 'sub' + sub.id

  return sub
}

},{"./gen.js":96}],132:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'switch',

  gen() {
    let inputs = gen.getInputs( this ), out

    if( inputs[1] === inputs[2] ) return inputs[1] // if both potential outputs are the same just return one of them
    
    out = `  var ${this.name}_out = ${inputs[0]} === 1 ? ${inputs[1]} : ${inputs[2]}\n`

    gen.memo[ this.name ] = `${this.name}_out`

    return [ `${this.name}_out`, out ]
  },

}

module.exports = ( control, in1 = 1, in2 = 0 ) => {
  let ugen = Object.create( proto )
  Object.assign( ugen, {
    uid:     gen.getUID(),
    inputs:  [ control, in1, in2 ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":96}],133:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'t60',

  gen() {
    let out,
        inputs = gen.getInputs( this ),
        returnValue

    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ [ 'exp' ]: Math.exp })

      out = `  var ${this.name} = gen.exp( -6.907755278921 / ${inputs[0]} )\n\n`
     
      gen.memo[ this.name ] = out
      
      returnValue = [ this.name, out ]
    } else {
      out = Math.exp( -6.907755278921 / inputs[0] )

      returnValue = out
    }    

    return returnValue
  }
}

module.exports = x => {
  let t60 = Object.create( proto )

  t60.inputs = [ x ]
  t60.name = proto.basename + gen.getUID()

  return t60
}

},{"./gen.js":96}],134:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'tan',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'tan': Math.tan })

      out = `gen.tan( ${inputs[0]} )` 

    } else {
      out = Math.tan( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let tan = Object.create( proto )

  tan.inputs = [ x ]
  tan.id = gen.getUID()
  tan.name = `${tan.basename}{tan.id}`

  return tan
}

},{"./gen.js":96}],135:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'tanh',

  gen() {
    let out,
        inputs = gen.getInputs( this )
    
    if( isNaN( inputs[0] ) ) {
      gen.closures.add({ 'tanh': Math.tanh })

      out = `gen.tanh( ${inputs[0]} )` 

    } else {
      out = Math.tanh( parseFloat( inputs[0] ) )
    }
    
    return out
  }
}

module.exports = x => {
  let tanh = Object.create( proto )

  tanh.inputs = [ x ]
  tanh.id = gen.getUID()
  tanh.name = `${tanh.basename}{tanh.id}`

  return tanh
}

},{"./gen.js":96}],136:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    lt      = require( './lt.js' ),
    phasor  = require( './phasor.js' )

module.exports = ( frequency=440, pulsewidth=.5 ) => {
  let graph = lt( accum( div( frequency, 44100 ) ), .5 )

  graph.name = `train${gen.getUID()}`

  return graph
}


},{"./gen.js":96,"./lt.js":104,"./phasor.js":121}],137:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' ),
    data = require( './data.js' )

let isStereo = false

let utilities = {
  ctx: null,

  clear() {
    this.callback = () => 0
    this.clear.callbacks.forEach( v => v() )
    this.clear.callbacks.length = 0
  },

  createContext() {
    let AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext
    this.ctx = new AC()

    gen.samplerate = this.ctx.sampleRate

    let start = () => {
      if( typeof AC !== 'undefined' ) {
        if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
          window.removeEventListener( 'touchstart', start )

          if( 'ontouchstart' in document.documentElement ) { // required to start audio under iOS 6
             let mySource = utilities.ctx.createBufferSource()
             mySource.connect( utilities.ctx.destination )
             mySource.noteOn( 0 )
           }
         }
      }
    }

    if( document && document.documentElement && 'ontouchstart' in document.documentElement ) {
      window.addEventListener( 'touchstart', start )
    }

    return this
  },

  createScriptProcessor() {
    this.node = this.ctx.createScriptProcessor( 1024, 0, 2 )
    this.clearFunction = function() { return 0 }
    if( typeof this.callback === 'undefined' ) this.callback = this.clearFunction

    this.node.onaudioprocess = function( audioProcessingEvent ) {
      var outputBuffer = audioProcessingEvent.outputBuffer;

      var left = outputBuffer.getChannelData( 0 ),
          right= outputBuffer.getChannelData( 1 ),
          isStereo = utilities.isStereo

     for( var sample = 0; sample < left.length; sample++ ) {
        var out = utilities.callback()

        if( isStereo === false ) {
          left[ sample ] = right[ sample ] = out 
        }else{
          var out = utilities.callback()
          left[ sample  ] = out[0]
          right[ sample ] = out[1]
        }
      }
    }

    this.node.connect( this.ctx.destination )

    return this
  },
  
  playGraph( graph, debug, mem=44100*10 ) {
    utilities.clear()
    if( debug === undefined ) debug = false
          
    this.isStereo = Array.isArray( graph )

    utilities.callback = gen.createCallback( graph, mem, debug )
    
    if( utilities.console ) utilities.console.setValue( utilities.callback.toString() )

    return utilities.callback
  },

  loadSample( soundFilePath, data ) {
    let req = new XMLHttpRequest()
    req.open( 'GET', soundFilePath, true )
    req.responseType = 'arraybuffer' 
    
    let promise = new Promise( (resolve,reject) => {
      req.onload = function() {
        var audioData = req.response

        utilities.ctx.decodeAudioData( audioData, (buffer) => {
          data.buffer = buffer.getChannelData(0)
          resolve( data.buffer )
        })
      }
    })

    req.send()

    return promise
  }

}

utilities.clear.callbacks = []

module.exports = utilities

},{"./data.js":84,"./gen.js":96}],138:[function(require,module,exports){
'use strict'

/*
 * many windows here adapted from https://github.com/corbanbrook/dsp.js/blob/master/dsp.js
 * starting at line 1427
 * taken 8/15/16
*/ 

const windows = module.exports = { 
  bartlett( length, index ) {
    return 2 / (length - 1) * ((length - 1) / 2 - Math.abs(index - (length - 1) / 2)) 
  },

  bartlettHann( length, index ) {
    return 0.62 - 0.48 * Math.abs(index / (length - 1) - 0.5) - 0.38 * Math.cos( 2 * Math.PI * index / (length - 1))
  },

  blackman( length, index, alpha ) {
    let a0 = (1 - alpha) / 2,
        a1 = 0.5,
        a2 = alpha / 2

    return a0 - a1 * Math.cos(2 * Math.PI * index / (length - 1)) + a2 * Math.cos(4 * Math.PI * index / (length - 1))
  },

  cosine( length, index ) {
    return Math.cos(Math.PI * index / (length - 1) - Math.PI / 2)
  },

  gauss( length, index, alpha ) {
    return Math.pow(Math.E, -0.5 * Math.pow((index - (length - 1) / 2) / (alpha * (length - 1) / 2), 2))
  },

  hamming( length, index ) {
    return 0.54 - 0.46 * Math.cos( Math.PI * 2 * index / (length - 1))
  },

  hann( length, index ) {
    return 0.5 * (1 - Math.cos( Math.PI * 2 * index / (length - 1)) )
  },

  lanczos( length, index ) {
    let x = 2 * index / (length - 1) - 1;
    return Math.sin(Math.PI * x) / (Math.PI * x)
  },

  rectangular( length, index ) {
    return 1
  },

  triangular( length, index ) {
    return 2 / length * (length / 2 - Math.abs(index - (length - 1) / 2))
  },

  // parabola
  welch( length, _index, ignore, shift=0 ) {
    //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
    const index = shift === 0 ? _index : (_index + Math.floor( shift * length )) % length
    const n_1_over2 = (length - 1) / 2 

    return 1 - Math.pow( ( index - n_1_over2 ) / n_1_over2, 2 )
  },
  inversewelch( length, _index, ignore, shift=0 ) {
    //w[n] = 1 - Math.pow( ( n - ( (N-1) / 2 ) ) / (( N-1 ) / 2 ), 2 )
    let index = shift === 0 ? _index : (_index + Math.floor( shift * length )) % length
    const n_1_over2 = (length - 1) / 2

    return Math.pow( ( index - n_1_over2 ) / n_1_over2, 2 )
  },

  parabola( length, index ) {
    if( index <= length / 2 ) {
      return windows.inversewelch( length / 2, index ) - 1
    }else{
      return 1 - windows.inversewelch( length / 2, index - length / 2 )
    }
  },

  exponential( length, index, alpha ) {
    return Math.pow( index / length, alpha )
  },

  linear( length, index ) {
    return index / length
  }
}

},{}],139:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js'),
    floor= require('./floor.js'),
    sub  = require('./sub.js'),
    memo = require('./memo.js')

let proto = {
  basename:'wrap',

  gen() {
    let code,
        inputs = gen.getInputs( this ),
        signal = inputs[0], min = inputs[1], max = inputs[2],
        out, diff

    //out = `(((${inputs[0]} - ${this.min}) % ${diff}  + ${diff}) % ${diff} + ${this.min})`
    //const long numWraps = long((v-lo)/range) - (v < lo);
    //return v - range * double(numWraps);   
    
    if( this.min === 0 ) {
      diff = max
    }else if ( isNaN( max ) || isNaN( min ) ) {
      diff = `${max} - ${min}`
    }else{
      diff = max - min
    }

    out =
` var ${this.name} = ${inputs[0]}
  if( ${this.name} < ${this.min} ) ${this.name} += ${diff}
  else if( ${this.name} > ${this.max} ) ${this.name} -= ${diff}

`

    return [ this.name, ' ' + out ]
  },
}

module.exports = ( in1, min=0, max=1 ) => {
  let ugen = Object.create( proto )

  Object.assign( ugen, { 
    min, 
    max,
    uid:    gen.getUID(),
    inputs: [ in1, min, max ],
  })
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./floor.js":93,"./gen.js":96,"./memo.js":108,"./sub.js":131}],140:[function(require,module,exports){
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

'use strict';

// Generate an internal UID to make the regexp pattern harder to guess.
var UID                 = Math.floor(Math.random() * 0x10000000000).toString(16);
var PLACE_HOLDER_REGEXP = new RegExp('"@__(F|R|D)-' + UID + '-(\\d+)__@"', 'g');

var IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
var UNSAFE_CHARS_REGEXP   = /[<>\/\u2028\u2029]/g;

// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
var ESCAPED_CHARS = {
    '<'     : '\\u003C',
    '>'     : '\\u003E',
    '/'     : '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};

function escapeUnsafeChars(unsafeChar) {
    return ESCAPED_CHARS[unsafeChar];
}

module.exports = function serialize(obj, options) {
    options || (options = {});

    // Backwards-compatibility for `space` as the second argument.
    if (typeof options === 'number' || typeof options === 'string') {
        options = {space: options};
    }

    var functions = [];
    var regexps   = [];
    var dates     = [];

    // Returns placeholders for functions and regexps (identified by index)
    // which are later replaced by their string representation.
    function replacer(key, value) {
        if (!value) {
            return value;
        }

        // If the value is an object w/ a toJSON method, toJSON is called before
        // the replacer runs, so we use this[key] to get the non-toJSONed value.
        var origValue = this[key];
        var type = typeof origValue;

        if (type === 'object') {
            if(origValue instanceof RegExp) {
                return '@__R-' + UID + '-' + (regexps.push(origValue) - 1) + '__@';
            }

            if(origValue instanceof Date) {
                return '@__D-' + UID + '-' + (dates.push(origValue) - 1) + '__@';
            }
        }

        if (type === 'function') {
            return '@__F-' + UID + '-' + (functions.push(origValue) - 1) + '__@';
        }

        return value;
    }

    var str;

    // Creates a JSON string representation of the value.
    // NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
    if (options.isJSON && !options.space) {
        str = JSON.stringify(obj);
    } else {
        str = JSON.stringify(obj, options.isJSON ? null : replacer, options.space);
    }

    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (typeof str !== 'string') {
        return String(str);
    }

    // Replace unsafe HTML and invalid JavaScript line terminator chars with
    // their safe Unicode char counterpart. This _must_ happen before the
    // regexps and functions are serialized and added back to the string.
    if (options.unsafe !== true) {
        str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
    }

    if (functions.length === 0 && regexps.length === 0 && dates.length === 0) {
        return str;
    }

    // Replaces all occurrences of function, regexp and date placeholders in the
    // JSON string with their string representations. If the original value can
    // not be found, then `undefined` is used.
    return str.replace(PLACE_HOLDER_REGEXP, function (match, type, valueIndex) {
        if (type === 'D') {
            return "new Date(\"" + dates[valueIndex].toISOString() + "\")";
        }

        if (type === 'R') {
            return regexps[valueIndex].toString();
        }

        var fn           = functions[valueIndex];
        var serializedFn = fn.toString();

        if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
            throw new TypeError('Serializing native function: ' + fn.name);
        }

        return serializedFn;
    });
}

},{}],141:[function(require,module,exports){
'use strict'

let MemoryHelper = {
  create( sizeOrBuffer=4096, memtype=Float32Array ) {
    let helper = Object.create( this )

    // conveniently, buffer constructors accept either a size or an array buffer to use...
    // so, no matter which is passed to sizeOrBuffer it should work.
    Object.assign( helper, {
      heap: new memtype( sizeOrBuffer ),
      list: {},
      freeList: {}
    })

    return helper
  },

  alloc( size, immutable ) {
    let idx = -1

    if( size > this.heap.length ) {
      throw Error( 'Allocation request is larger than heap size of ' + this.heap.length )
    }

    for( let key in this.freeList ) {
      let candidate = this.freeList[ key ]

      if( candidate.size >= size ) {
        idx = key

        this.list[ idx ] = { size, immutable, references:1 }

        if( candidate.size !== size ) {
          let newIndex = idx + size,
              newFreeSize

          for( let key in this.list ) {
            if( key > newIndex ) {
              newFreeSize = key - newIndex
              this.freeList[ newIndex ] = newFreeSize
            }
          }
        }

        break
      }
    }

    if( idx !== -1 ) delete this.freeList[ idx ]

    if( idx === -1 ) {
      let keys = Object.keys( this.list ),
          lastIndex

      if( keys.length ) { // if not first allocation...
        lastIndex = parseInt( keys[ keys.length - 1 ] )

        idx = lastIndex + this.list[ lastIndex ].size
      }else{
        idx = 0
      }

      this.list[ idx ] = { size, immutable, references:1 }
    }

    if( idx + size >= this.heap.length ) {
      throw Error( 'No available blocks remain sufficient for allocation request.' )
    }
    return idx
  },

  addReference( index ) {
    if( this.list[ index ] !== undefined ) { 
      this.list[ index ].references++
    }
  },

  free( index ) {
    if( this.list[ index ] === undefined ) {
      throw Error( 'Calling free() on non-existing block.' )
    }

    let slot = this.list[ index ]
    if( slot === 0 ) return
    slot.references--

    if( slot.references === 0 && slot.immutable !== true ) {    
      this.list[ index ] = 0

      let freeBlockSize = 0
      for( let key in this.list ) {
        if( key > index ) {
          freeBlockSize = key - index
          break
        }
      }

      this.freeList[ index ] = freeBlockSize
    }
  },
}

module.exports = MemoryHelper

},{}]},{},[32])(32)
});
let processor = null

class GibberishProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {}

  constructor( options ) {
    super( options )
    
    Gibberish = window.Gibberish
    Gibberish.ctx = { sampleRate }
    Gibberish.genish.hasWorklet = false
    Gibberish.preventProxy = true
    Gibberish.init( undefined, undefined, 'processor' )
    Gibberish.preventProxy = false
    Gibberish.debug = false 
    Gibberish.processor = this

    this.port.onmessage = this.handleMessage.bind( this )
    this.queue = []
    Gibberish.ugens = this.ugens = new Map()

    // XXX ridiculous hack to get around processor not having a worklet property
    Gibberish.worklet = { ugens: this.ugens }

    this.ugens.set( Gibberish.id, Gibberish )
    processor = this

    this.messages = []
  }

  replaceProperties( obj ) {
    if( Array.isArray( obj ) ) {
      const out = []
      for( let i = 0; i < obj.length; i++ ){
        const prop = obj[ i ]
        if( prop === null ) continue
        //console.log( 'PROP:', prop )
        if( typeof prop === 'object' && prop.id !== undefined ) {
          let objCheck = this.ugens.get( prop.id )

          if( objCheck !== undefined ) {
            out[ i ] = prop.prop !== undefined ? objCheck[ prop.prop ] : objCheck

            if( prop.prop !== undefined ) console.log( 'got a ssd.out', prop, objCheck )
          }else{
            out[ i ]= prop
          }
        }else{
          if( prop === null ) continue

          if( typeof prop === 'object' && prop.action === 'wrap' ) {
            out[ i  ] = prop.value.bind( null, ...this.replaceProperties( prop.args ) )
          }else if( Array.isArray( prop ) ) {
            out[ i ] = this.replaceProperties( prop )
          }else{
            out[ i ] = prop
          }
        }
      }

      return out
    }else{
      const properties = obj
      for( let key in properties) {
        let prop = properties[ key ]
        if( typeof prop === 'object' && prop !== null && prop.id !== undefined ) {
          let objCheck = this.ugens.get( prop.id )
          if( objCheck !== undefined ) {
            properties[ key ] = objCheck
          } 
        }else if( Array.isArray( prop ) ) {
          properties[ key ] = this.replaceProperties( prop )
        }else{
          if( typeof prop === 'object' && prop !== null && prop.action === 'wrap' ) {
            properties[ key ] = prop.value()
          }
        }
      } 
      return properties
    }
    return obj
  }

  // playback delayed messages and clear the queue
  playQueue() {
    // must set delay property to false!!! otherwise the message
    // will be delayed continually...
    this.queue.forEach( m => { m.data.delay = false; this.handleMessage( m ) } )
    this.queue.length = 0
  }

  handleMessage( event ) {
    if( event.data.delay === true ) {
      // we want to delay this message for some time in the future,
      // for example, when forcing code to execute at the start of the next
      // measure. playQueue will trigger all messages in the queue
      this.queue.push( event )

      return
    }

    if( event.data.address === 'add' ) {

      const rep = event.data
      let constructor = Gibberish

      let properties = this.replaceProperties(  eval( '(' + rep.properties + ')' ) )
      //console.log( 'properties:', properties )

      let ugen

      // if object is not a gibberish ugen...
      if( properties.nogibberish ) {
        ugen = properties
      }else{
        for( let i = 0; i < rep.name.length; i++ ) { constructor = constructor[ rep.name[ i ] ] }
        properties.id = rep.id
        ugen = properties.isop === true || properties.isPattern === true ? constructor( ...properties.inputs ) :  constructor( properties )

        if( properties.isPattern ) {
          for( let key in properties ) {
            if( key !== 'input' && key !== 'isPattern' ) {
              ugen[ key ] = properties[ key ]
            }
          }
        }
      }
      
      if( rep.post ) {
        ugen[ rep.post ]()
      }

      //console.log( 'adding ugen:', ugen.id, ugen, rep )
      this.ugens.set( rep.id, ugen )

      ugen.id = rep.id
      initialized = true

    }else if( event.data.address === 'method' ) {
      //if( event.data.name === 'clear' )
        //console.log( event.data.address, event.data.name, event.data.args, this.ugens )

      const dict = event.data
      const obj  = this.ugens.get( dict.object )

      if( typeof obj[ dict.name ] !== 'function' ) return
      // for edge case when serialized functions are being passed to method calls
      if( dict.functions === true ) {
        obj[ dict.name ]( eval( '(' + dict.args + ')' ) ) 
      }else{
        obj[ dict.name ]( ...dict.args.map( Gibberish.proxyReplace ) ) 
      }
    }else if( event.data.address === 'property' ) {
      // XXX this is the exact same as the 'set' key... ugh.
      const dict = event.data
      const obj  = this.ugens.get( dict.object )
      obj[ dict.name ] = dict.value
    }else if( event.data.address === 'print' ) {
      const dict = event.data
      const obj  = this.ugens.get( dict.object ) 
      console.log( 'printing:', dict.object, obj )
    }else if( event.data.address === 'printProperty' ) {
      const dict = event.data
      const obj  = this.ugens.get( dict.object )
      console.log( 'printing:', obj[ dict.name ] )    
    }else if( event.data.address === 'set' ) {
      const dict = event.data
      const obj = this.ugens.get( dict.object )
      //console.log( 'setting:', dict.name, dict.value, obj )
      obj[ dict.name ] = dict.value
    }else if( event.data.address === 'copy' ) {
      const target = this.ugens.get( event.data.id )

      if( target === undefined ) {
        // this should only occur when a buffer is loaded prior to a delayed instantiation. for example,
        // if gibber starts downloading a file, on beat two and is finished by beat three, the next measure
        // will not have occurred yet, meaning a delayed sampler instantiation will not yet have occurred.
        // in this case, we wait until the next measure boundary.
        this.queue.push( event )
      }else{
        target.data.onload( event.data.buffer )
      }
    }else if( event.data.address === 'callback' ) {
      console.log( Gibberish.callback.toString() )
    }else if( event.data.address === 'addConstructor' ) {
      const wrapper = eval( '(' + event.data.constructorString + ')' )
      Gibberish[ event.data.name ] = wrapper( Gibberish )
    }else if( event.data.address === 'addMethod' ) {
      const target = this.ugens.get( event.data.id )

      if( target[ event.data.key ] === undefined ) {
        target[ event.data.key ] = eval( '(' + event.data.function + ')' )
        //console.log( 'adding method:', target, event.data.key )
      }
    }else if( event.data.address === 'monkeyPatch' ) {
      const target = this.ugens.get( event.data.id )
      if( target['___'+event.data.key] === undefined ) {
        target[ '___' + event.data.key ] = target[ event.data.key ]
        target[ event.data.key ] = eval( '(' + event.data.function + ')' )
        //console.log( 'monkey patch:', target, event.data.key )
      }
    }else if( event.data.address === 'dirty' ) {
      const obj = this.ugens.get( event.data.id )
      Gibberish.dirty( obj )
    }else if( event.data.address === 'initialize' ) {
      initialized = true
    }else if( event.data.address === 'addToProperty' ) {
      const dict = event.data
      const obj  = this.ugens.get( dict.object )
      obj[ dict.name ][ dict.key ] = dict.value
    }else if( event.data.address === 'messages' ) {
      console.log( 'messages:', this.messages )
    }else if( event.data.address === 'eval' ) {
      eval( event.data.code )
    }
  }

  process(inputs, outputs, parameters) {
    if( initialized === true ) {
      const gibberish = Gibberish
      const scheduler = gibberish.scheduler
      let   callback  = this.callback
      let   ugens     = gibberish.callbackUgens 

      this.messages.length = 0
      // XXX is there some way to optimize this out?
      if( callback === undefined && gibberish.graphIsDirty === false ) return true

      let callbacklength = gibberish.blockCallbacks.length

      if( callbacklength !== 0 ) {
        for( let i=0; i< callbacklength; i++ ) {
          gibberish.blockCallbacks[ i ]()
        }

        // can't just set length to 0 as callbacks might be added during for loop,
        // so splice pre-existing functions
        gibberish.blockCallbacks.splice( 0, callbacklength )
      }

      const output = outputs[ 0 ]
      const len = outputs[0][0].length
      for (let i = 0; i < len; ++i) {
        scheduler.tick()

        if( gibberish.graphIsDirty ) {
          const oldCallback = callback
          const oldUgens = ugens

          //try{
            this.callback = callback = gibberish.generateCallback()
            ugens = gibberish.callbackUgens
            // XXX should we try/catch the callback here?
            //const out = callback.apply( null, ugens )
            //output[0][ i ] = out[0]
            //output[1][ i ] = out[1] 
          //}catch(e) {

          //  console.log( 'callback error:', e, callback.toString() )
          //  this.callback = callback = oldCallback
          //  ugens = gibberish.callbackUgens = oldUgens
          //  gibberish.callbackNames = ugens.map( v => v.ugenName )
          //}
        }
        const out = callback.apply( null, ugens )
        //const out = callback()

        output[0][ i ] = out[0]
        output[1][ i ] = out[1] 
      }
      if( ugens.length > 1 ) {
        for( let i = 1; i < ugens.length - 1; i++ ) {
          const ugen = ugens[ i ]
          if( ugen.out !== undefined ) {
            this.messages.push( ugen.id, 'output', ugen.out[ 0 ] )
          }
        }
      }     
      if( this.messages.length > 0 ) {
 
        this.port.postMessage({ 
          address:'state', 
          messages:this.messages 
        })
      }
    }
   
    // make sure this is always returned or the callback ceases!!!
    return true
  }
}
window.Gibberish.workletProcessor = GibberishProcessor 
           registerProcessor( 'gibberish', window.Gibberish.workletProcessor );
