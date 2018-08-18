const window = {}; 
        let Gibberish = null; 
        let initialized = false;
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Gibberish = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./gen.js":30}],2:[function(require,module,exports){
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
      if( this.resetValue !== this.min ) {

        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.resetValue}\n\n`
        //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
      }else{
        out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.min}\n\n`
        //out += `  if( ${_reset} >=1 ) ${valueRef} = ${this.initialValue}\n\n`
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
  },

  defaults : { min:0, max:1, resetValue:0, initialValue:0, shouldWrap:true, shouldWrapMax: true, shouldWrapMin:true, shouldClamp:false }
}

module.exports = ( incr, reset=0, properties ) => {
  const ugen = Object.create( proto )
      
  Object.assign( ugen, 
    { 
      uid:    gen.getUID(),
      inputs: [ incr, reset ],
      memory: {
        value: { length:1, idx:null }
      }
    },
    proto.defaults,
    properties 
  )

  if( properties !== undefined && properties.shouldWrapMax === undefined && properties.shouldWrapMin === undefined ) {
    if( properties.shouldWrap !== undefined ) {
      ugen.shouldWrapMin = ugen.shouldWrapMax = properties.shouldWrap
    }
  }

  if( properties !== undefined && properties.resetValue === undefined ) {
    ugen.resetValue = ugen.min
  }

  if( ugen.initialValue === undefined ) ugen.initialValue = ugen.min

  Object.defineProperty( ugen, 'value', {
    get()  { 
      //console.log( 'gen:', gen, gen.memory )
      return gen.memory.heap[ this.memory.value.idx ] 
    },
    set(v) { gen.memory.heap[ this.memory.value.idx ] = v }
  })

  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":30}],3:[function(require,module,exports){
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

},{"./gen.js":30}],4:[function(require,module,exports){
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
  const props = Object.assign({}, { shape:'exponential', alpha:5, trigger:null }, _props )
  const _bang = props.trigger !== null ? props.trigger : bang(),
        phase = accum( 1, _bang, { min:0, max: Infinity, initialValue:-Infinity, shouldWrap:false })
      
  let bufferData, bufferDataReverse, decayData, out, buffer

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

},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,"./div.js":23,"./env.js":24,"./gen.js":30,"./gte.js":32,"./ifelseif.js":35,"./lt.js":38,"./memo.js":42,"./mul.js":48,"./neq.js":49,"./peek.js":54,"./poke.js":56,"./sub.js":65}],5:[function(require,module,exports){
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

},{"./gen.js":30}],6:[function(require,module,exports){
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

},{"./accum.js":2,"./add.js":5,"./and.js":7,"./bang.js":11,"./data.js":18,"./div.js":23,"./env.js":24,"./gen.js":30,"./gtp.js":33,"./ifelseif.js":35,"./lt.js":38,"./mul.js":48,"./neq.js":49,"./not.js":51,"./param.js":53,"./peek.js":54,"./poke.js":56,"./sub.js":65}],7:[function(require,module,exports){
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

},{"./gen.js":30}],8:[function(require,module,exports){
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

},{"./gen.js":30}],9:[function(require,module,exports){
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

},{"./gen.js":30}],10:[function(require,module,exports){
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

},{"./gen.js":30,"./history.js":34,"./mul.js":48,"./sub.js":65}],11:[function(require,module,exports){
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

},{"./gen.js":30}],12:[function(require,module,exports){
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


},{"./gen.js":30}],13:[function(require,module,exports){
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

},{"./gen.js":30}],14:[function(require,module,exports){
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

},{"./floor.js":27,"./gen.js":30,"./memo.js":42,"./sub.js":65}],15:[function(require,module,exports){
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

},{"./gen.js":30}],16:[function(require,module,exports){
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
    gen.memory.heap[ this.memory.value.idx ] = this.initialValue
    
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
      defaults = Object.assign( { initialValue: 0, shouldWrap:true }, properties )

  Object.assign( ugen, { 
    min:    min, 
    max:    max,
    initialValue: defaults.initialValue,
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

},{"./gen.js":30}],17:[function(require,module,exports){
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

},{"./data.js":18,"./gen.js":30,"./mul.js":48,"./peek.js":54,"./phasor.js":55}],18:[function(require,module,exports){
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
  
  ugen = Object.create( proto )

  Object.assign( ugen, { 
    buffer,
    name: proto.basename + gen.getUID(),
    dim:  buffer.length, // XXX how do we dynamically allocate this?
    channels : 1,
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
        if( typeof ugen.onload === 'function' ) ugen.onload() 
      })
    },
    memory : {
      values: { length:buffer.length, idx:null }
    }
  })

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

},{"./gen.js":30,"./peek.js":54,"./poke.js":56,"./utilities.js":71}],19:[function(require,module,exports){
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

},{"./add.js":5,"./gen.js":30,"./history.js":34,"./memo.js":42,"./mul.js":48,"./sub.js":65}],20:[function(require,module,exports){
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

},{"./gen.js":30,"./history.js":34,"./mul.js":48,"./t60.js":67}],21:[function(require,module,exports){
'use strict'

const gen  = require( './gen.js'  ),
      data = require( './data.js' ),
      poke = require( './poke.js' ),
      peek = require( './peek.js' ),
      sub  = require( './sub.js'  ),
      wrap = require( './wrap.js' ),
      accum= require( './accum.js'),
      memo = require( './memo.js' )

const proto = {
  basename:'delay',

  gen() {
    let inputs = gen.getInputs( this )
    
    gen.memo[ this.name ] = inputs[0]
    
    return inputs[0]
  },
}

const defaults = { size: 512, interp:'none' }

module.exports = ( in1, taps, properties ) => {
  const ugen = Object.create( proto )
  let writeIdx, readIdx, delaydata

  if( Array.isArray( taps ) === false ) taps = [ taps ]
  
  const props = Object.assign( {}, defaults, properties )

  const maxTapSize = Math.max( ...taps )
  if( props.size < maxTapSize ) props.size = maxTapSize

  delaydata = data( props.size )
  
  ugen.inputs = []

  writeIdx = accum( 1, 0, { max:props.size, min:0 })
  
  for( let i = 0; i < taps.length; i++ ) {
    ugen.inputs[ i ] = peek( delaydata, wrap( sub( writeIdx, taps[i] ), 0, props.size ),{ mode:'samples', interp:props.interp })
  }
  
  ugen.outputs = ugen.inputs // XXX ugh, Ugh, UGH! but i guess it works.

  poke( delaydata, in1, writeIdx )

  ugen.name = `${ugen.basename}${gen.getUID()}`

  return ugen
}

},{"./accum.js":2,"./data.js":18,"./gen.js":30,"./memo.js":42,"./peek.js":54,"./poke.js":56,"./sub.js":65,"./wrap.js":73}],22:[function(require,module,exports){
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

},{"./gen.js":30,"./history.js":34,"./sub.js":65}],23:[function(require,module,exports){
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

},{"./gen.js":30}],24:[function(require,module,exports){
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

},{"./data":18,"./gen":30,"./peek":54,"./phasor":55,"./windows":72}],25:[function(require,module,exports){
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

},{"./gen.js":30}],26:[function(require,module,exports){
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

},{"./gen.js":30}],27:[function(require,module,exports){
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

},{"./gen.js":30}],28:[function(require,module,exports){
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

},{"./gen.js":30}],29:[function(require,module,exports){
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

},{"./gen.js":30}],30:[function(require,module,exports){
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

  //data: {},
  
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

      //console.log( 'requesting ' + key + ':' , JSON.stringify( request ) )

      if( request.length === undefined ) {
        console.log( 'undefined length for:', key )

        continue
      }

      request.idx = gen.memory.alloc( request.length, immutable )
    }
  },

  createMemory( amount, type ) {
    const mem = MemoryHelper.create( amount, type )
    return mem
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
  
  createCallback( ugen, mem, debug = false, shouldInlineMemory=false, memType = Float64Array ) {
    let isStereo = Array.isArray( ugen ) && ugen.length > 1,
        callback, 
        channel1, channel2

    if( typeof mem === 'number' || mem === undefined ) {
      mem = MemoryHelper.create( mem, memType )
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
    callback.out  = new Float64Array( 2 )
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

},{"memory-helper":141}],31:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'gt',

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
  gt.name = gt.basename + gen.getUID()

  return gt
}

},{"./gen.js":30}],32:[function(require,module,exports){
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

},{"./gen.js":30}],33:[function(require,module,exports){
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

},{"./gen.js":30}],34:[function(require,module,exports){
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

},{"./gen.js":30}],35:[function(require,module,exports){
'use strict'

let gen = require( './gen.js' )

let proto = {
  basename:'ifelse',

  gen() {
    let conditionals = this.inputs[0],
        defaultValue = gen.getInput( conditionals[ conditionals.length - 1] ),
        out = `  var ${this.name}_out = ${defaultValue}\n` 

    //console.log( 'conditionals:', this.name, conditionals )

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

},{"./gen.js":30}],36:[function(require,module,exports){
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

},{"./gen.js":30}],37:[function(require,module,exports){
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

},{"./abs.js":1,"./accum.js":2,"./acos.js":3,"./ad.js":4,"./add.js":5,"./adsr.js":6,"./and.js":7,"./asin.js":8,"./atan.js":9,"./attack.js":10,"./bang.js":11,"./bool.js":12,"./ceil.js":13,"./clamp.js":14,"./cos.js":15,"./counter.js":16,"./cycle.js":17,"./data.js":18,"./dcblock.js":19,"./decay.js":20,"./delay.js":21,"./delta.js":22,"./div.js":23,"./env.js":24,"./eq.js":25,"./exp.js":26,"./floor.js":27,"./fold.js":28,"./gate.js":29,"./gen.js":30,"./gt.js":31,"./gte.js":32,"./gtp.js":33,"./history.js":34,"./ifelseif.js":35,"./in.js":36,"./lt.js":38,"./lte.js":39,"./ltp.js":40,"./max.js":41,"./memo.js":42,"./min.js":43,"./mix.js":44,"./mod.js":45,"./mstosamps.js":46,"./mtof.js":47,"./mul.js":48,"./neq.js":49,"./noise.js":50,"./not.js":51,"./pan.js":52,"./param.js":53,"./peek.js":54,"./phasor.js":55,"./poke.js":56,"./pow.js":57,"./rate.js":58,"./round.js":59,"./sah.js":60,"./selector.js":61,"./sign.js":62,"./sin.js":63,"./slide.js":64,"./sub.js":65,"./switch.js":66,"./t60.js":67,"./tan.js":68,"./tanh.js":69,"./train.js":70,"./utilities.js":71,"./windows.js":72,"./wrap.js":73}],38:[function(require,module,exports){
'use strict'

let gen  = require('./gen.js')

let proto = {
  basename:'lt',

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
  lt.name = lt.basename + gen.getUID()

  return lt
}

},{"./gen.js":30}],39:[function(require,module,exports){
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

},{"./gen.js":30}],40:[function(require,module,exports){
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

},{"./gen.js":30}],41:[function(require,module,exports){
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

},{"./gen.js":30}],42:[function(require,module,exports){
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

},{"./gen.js":30}],43:[function(require,module,exports){
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

},{"./gen.js":30}],44:[function(require,module,exports){
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

},{"./add.js":5,"./gen.js":30,"./memo.js":42,"./mul.js":48,"./sub.js":65}],45:[function(require,module,exports){
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

},{"./gen.js":30}],46:[function(require,module,exports){
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

},{"./gen.js":30}],47:[function(require,module,exports){
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

},{"./gen.js":30}],48:[function(require,module,exports){
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

},{"./gen.js":30}],49:[function(require,module,exports){
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

},{"./gen.js":30}],50:[function(require,module,exports){
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

},{"./gen.js":30}],51:[function(require,module,exports){
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

},{"./gen.js":30}],52:[function(require,module,exports){
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

},{"./data.js":18,"./gen.js":30,"./mul.js":48,"./peek.js":54}],53:[function(require,module,exports){
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

},{"./gen.js":30}],54:[function(require,module,exports){
'use strict'

const gen  = require('./gen.js'),
      dataUgen = require('./data.js')

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

  defaults : { channels:1, mode:'phase', interp:'linear', boundmode:'wrap' }
}

module.exports = ( input_data, index=0, properties ) => {
  let ugen = Object.create( proto )

  //console.log( dataUgen, gen.data )

  // XXX why is dataUgen not the actual function? some type of browserify nonsense...
  const finalData = typeof input_data.basename === 'undefined' ? gen.lib.data( input_data ) : input_data

  Object.assign( ugen, 
    { 
      'data':     finalData,
      dataName:   finalData.name,
      uid:        gen.getUID(),
      inputs:     [ index, finalData ],
    },
    proto.defaults,
    properties 
  )
  
  ugen.name = ugen.basename + ugen.uid

  return ugen
}

},{"./data.js":18,"./gen.js":30}],55:[function(require,module,exports){
'use strict'

let gen   = require( './gen.js' ),
    accum = require( './accum.js' ),
    mul   = require( './mul.js' ),
    proto = { basename:'phasor' },
    div   = require( './div.js' )

const defaults = { min: -1, max: 1 }

module.exports = ( frequency = 1, reset = 0, _props ) => {
  const props = Object.assign( {}, defaults, _props )

  const range = props.max - props.min

  const ugen = typeof frequency === 'number' 
    ? accum( (frequency * range) / gen.samplerate, reset, props ) 
    : accum( 
        div( 
          mul( frequency, range ),
          gen.samplerate
        ), 
        reset, props 
    )

  ugen.name = proto.basename + gen.getUID()

  return ugen
}

},{"./accum.js":2,"./div.js":23,"./gen.js":30,"./mul.js":48}],56:[function(require,module,exports){
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

},{"./gen.js":30,"./mul.js":48,"./wrap.js":73}],57:[function(require,module,exports){
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

},{"./gen.js":30}],58:[function(require,module,exports){
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

},{"./add.js":5,"./delta.js":22,"./gen.js":30,"./history.js":34,"./memo.js":42,"./mul.js":48,"./sub.js":65,"./wrap.js":73}],59:[function(require,module,exports){
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

},{"./gen.js":30}],60:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' )

let proto = {
  basename:'sah',

  gen() {
    let inputs = gen.getInputs( this ), out

    //gen.data[ this.name ] = 0
    //gen.data[ this.name + '_control' ] = 0

    gen.requestMemory( this.memory )


    out = 
` var ${this.name}_control = memory[${this.memory.control.idx}],
      ${this.name}_trigger = ${inputs[1]} > ${inputs[2]} ? 1 : 0

  if( ${this.name}_trigger !== ${this.name}_control  ) {
    if( ${this.name}_trigger === 1 ) 
      memory[${this.memory.value.idx}] = ${inputs[0]}
    
    memory[${this.memory.control.idx}] = ${this.name}_trigger
  }
`
    
    gen.memo[ this.name ] = `gen.data.${this.name}`

    return [ `memory[${this.memory.value.idx}]`, ' ' +out ]
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
    memory: {
      control: { idx:null, length:1 },
      value:   { idx:null, length:1 },
    }
  },
  defaults )
  
  ugen.name = `${ugen.basename}${ugen.uid}`

  return ugen
}

},{"./gen.js":30}],61:[function(require,module,exports){
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

},{"./gen.js":30}],62:[function(require,module,exports){
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

},{"./gen.js":30}],63:[function(require,module,exports){
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

},{"./gen.js":30}],64:[function(require,module,exports){
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

},{"./add.js":5,"./div.js":23,"./gen.js":30,"./gt.js":31,"./history.js":34,"./memo.js":42,"./mul.js":48,"./sub.js":65,"./switch.js":66}],65:[function(require,module,exports){
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

},{"./gen.js":30}],66:[function(require,module,exports){
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

},{"./gen.js":30}],67:[function(require,module,exports){
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

},{"./gen.js":30}],68:[function(require,module,exports){
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

},{"./gen.js":30}],69:[function(require,module,exports){
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

},{"./gen.js":30}],70:[function(require,module,exports){
'use strict'

let gen     = require( './gen.js' ),
    lt      = require( './lt.js' ),
    accum   = require( './accum.js' ),
    div     = require( './div.js' )

module.exports = ( frequency=440, pulsewidth=.5 ) => {
  let graph = lt( accum( div( frequency, 44100 ) ), pulsewidth )

  graph.name = `train${gen.getUID()}`

  return graph
}


},{"./accum.js":2,"./div.js":23,"./gen.js":30,"./lt.js":38}],71:[function(require,module,exports){
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
          left[ sample  ] = out[0]
          right[ sample ] = out[1]
        }
      }
    }

    this.node.connect( this.ctx.destination )

    return this
  },
  
  playGraph( graph, debug, mem=44100*10, memType=Float32Array ) {
    utilities.clear()
    if( debug === undefined ) debug = false
          
    this.isStereo = Array.isArray( graph )

    utilities.callback = gen.createCallback( graph, mem, debug, false, memType )
    
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

},{"./data.js":18,"./gen.js":30}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{"./floor.js":27,"./gen.js":30,"./memo.js":42,"./sub.js":65}],74:[function(require,module,exports){
let ugen = require( '../ugen.js' )

let analyzer = Object.create( ugen )

Object.assign( analyzer, {
  __type__: 'analyzer',
  priority:0
})

module.exports = analyzer

},{"../ugen.js":135}],75:[function(require,module,exports){
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

},{"./follow.js":76,"./singlesampledelay.js":77}],76:[function(require,module,exports){
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

        memory[genish.add(idx, phase)] = abs(input);
        phase++;
        if (phase > genish.sub(props.bufferSize, 1)) {
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
},{"../ugen.js":135,"./analyzer.js":74,"genish.js":37}],77:[function(require,module,exports){
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

},{"../ugen.js":135,"../workletProxy.js":138,"./analyzer.js":74,"genish.js":37}],78:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],79:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],80:[function(require,module,exports){
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

},{"./ad.js":78,"./adsr.js":79,"./ramp.js":81,"genish.js":37}],81:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
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

},{"genish.js":37}],84:[function(require,module,exports){
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


},{"./filter.js":87,"genish.js":37}],85:[function(require,module,exports){
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

},{"genish.js":37}],86:[function(require,module,exports){
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

},{"./filter.js":87,"genish.js":37}],87:[function(require,module,exports){
let ugen = require( '../ugen.js' )

let filter = Object.create( ugen )

Object.assign( filter, {
  defaults: { bypass:false } 
})

module.exports = filter

},{"../ugen.js":135}],88:[function(require,module,exports){
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


},{"./filter.js":87,"genish.js":37}],89:[function(require,module,exports){
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

},{"./allpass.js":83,"./biquad.js":84,"./combfilter.js":85,"./diodeFilterZDF.js":86,"./filter24.js":88,"./ladderFilterZeroDelay.js":90,"./svf.js":91}],90:[function(require,module,exports){
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


},{"./filter.js":87,"genish.js":37}],91:[function(require,module,exports){
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


},{"./filter.js":87,"genish.js":37}],92:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],93:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],94:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],95:[function(require,module,exports){
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
},{"./effect.js":98,"genish.js":37}],96:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],97:[function(require,module,exports){
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
},{"./effect.js":98,"genish.js":37}],98:[function(require,module,exports){
let ugen = require( '../ugen.js' )()

let effect = Object.create( ugen )

Object.assign( effect, {
  defaults: { bypass:false, inputGain:1 },
  type:'effect'
})

module.exports = effect

},{"../ugen.js":135}],99:[function(require,module,exports){
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

},{"./bitCrusher.js":92,"./bufferShuffler.js":93,"./chorus.js":94,"./dattorro.js":95,"./delay.js":96,"./distortion.js":97,"./flanger.js":100,"./freeverb.js":101,"./ringMod.js":102,"./tremolo.js":103,"./vibrato.js":104}],100:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],101:[function(require,module,exports){
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


},{"./effect.js":98,"genish.js":37}],102:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],103:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],104:[function(require,module,exports){
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

},{"./effect.js":98,"genish.js":37}],105:[function(require,module,exports){
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
  init( memAmount, ctx, mode ) {

    let numBytes = isNaN( memAmount ) ? 20 * 60 * 44100 : memAmount

    // regardless of whether or not gibberish is using worklets,
    // we still want genish to output vanilla js functions instead
    // of audio worklet classes; these functions will be called
    // from within the gibberish audioworklet processor node.
    this.genish.gen.mode = 'scriptProcessor'

    this.memory = MemoryHelper.create( numBytes, Float64Array )

    this.mode = window.AudioWorklet !== undefined ? 'worklet' : 'scriptprocessor'
    if( mode !== undefined ) this.mode = mode

    this.hasWorklet = window.AudioWorklet !== undefined && typeof window.AudioWorklet === 'function'

    const startup = this.hasWorklet ? this.utilities.createWorklet : this.utilities.createScriptProcessor
    
    this.analyzers.dirty = false

    if( this.mode === 'worklet' ) {

      const p = new Promise( (resolve, reject ) => {

        const pp = new Promise( (__resolve, __reject ) => {
          this.utilities.createContext( ctx, startup.bind( this.utilities ), __resolve )
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

},{"./analysis/analyzers.js":75,"./envelopes/envelopes.js":80,"./filters/filters.js":89,"./fx/effect.js":98,"./fx/effects.js":99,"./instruments/instrument.js":110,"./instruments/instruments.js":111,"./instruments/polyMixin.js":115,"./instruments/polytemplate.js":116,"./misc/binops.js":121,"./misc/bus.js":122,"./misc/bus2.js":123,"./misc/monops.js":124,"./misc/panner.js":125,"./misc/time.js":126,"./oscillators/oscillators.js":129,"./scheduling/scheduler.js":132,"./scheduling/seq2.js":133,"./scheduling/sequencer.js":134,"./ugen.js":135,"./ugenTemplate.js":136,"./utilities.js":137,"./workletProxy.js":138,"genish.js":37,"memory-helper":141}],106:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],107:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],108:[function(require,module,exports){
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
        if (props.panVoices === true) {
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
},{"./instrument.js":110,"genish.js":37}],109:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],110:[function(require,module,exports){
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

},{"../ugen.js":135}],111:[function(require,module,exports){
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

},{"./conga.js":106,"./cowbell.js":107,"./fm.js":108,"./hat.js":109,"./karplusstrong.js":112,"./kick.js":113,"./monosynth.js":114,"./sampler.js":117,"./snare.js":118,"./synth.js":119,"./tom.js":120}],112:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],113:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],114:[function(require,module,exports){
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
},{"../oscillators/fmfeedbackosc.js":128,"./instrument.js":110,"genish.js":37}],115:[function(require,module,exports){
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

},{"../index.js":105}],116:[function(require,module,exports){
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

},{"../workletProxy.js":138,"genish.js":37}],117:[function(require,module,exports){
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


},{"./instrument.js":110,"genish.js":37}],118:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],119:[function(require,module,exports){
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

        if (syn.panVoices === true) {
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
},{"./instrument.js":110,"genish.js":37}],120:[function(require,module,exports){
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

},{"./instrument.js":110,"genish.js":37}],121:[function(require,module,exports){
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

},{"../ugen.js":135,"../workletProxy.js":138}],122:[function(require,module,exports){
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


},{"../ugen.js":135,"../workletProxy.js":138,"genish.js":37}],123:[function(require,module,exports){
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
        get() { return pan },
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

},{"../ugen.js":135,"../workletProxy.js":138,"genish.js":37}],124:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],125:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],126:[function(require,module,exports){
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

},{}],127:[function(require,module,exports){
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
},{"genish.js":37}],128:[function(require,module,exports){
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

},{"genish.js":37}],129:[function(require,module,exports){
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

},{"../ugen.js":135,"./brownnoise.js":127,"./fmfeedbackosc.js":128,"./pinknoise.js":130,"./wavetable.js":131,"genish.js":37}],130:[function(require,module,exports){
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
},{"genish.js":37}],131:[function(require,module,exports){
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

},{"../ugen.js":135,"genish.js":37}],132:[function(require,module,exports){
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

},{"../external/priorityqueue.js":82,"big.js":139}],133:[function(require,module,exports){
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


},{"../ugen.js":135,"../workletProxy.js":138,"genish.js":37}],134:[function(require,module,exports){
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

},{"../workletProxy.js":138}],135:[function(require,module,exports){
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

},{}],136:[function(require,module,exports){
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

},{"./fx/effect.js":98,"./workletProxy.js":138}],137:[function(require,module,exports){
const genish = require( 'genish.js' )

module.exports = function( Gibberish ) {

let uid = 0

const utilities = {
  createContext( ctx, cb, resolve ) {
    let AC = typeof AudioContext === 'undefined' ? webkitAudioContext : AudioContext

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

},{"genish.js":37}],138:[function(require,module,exports){
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
                //if( prop === 'connect' ) console.log( 'proxy connect:', __args )

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
        if( prop !== 'connected' && prop !== 'input' && prop !== 'callback' && prop !== 'inputNames' ) {
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
    // REMEMBER THAT YOU MUST ASSIGNED THE RETURNED VALUE TO YOUR UGEN,
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

},{"serialize-javascript":140}],139:[function(require,module,exports){
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

        // Determine leading zeros.
        for (i = 0; n.charAt(i) == '0'; i++) {
        }

        if (i == (nL = n.length)) {

            // Zero.
            x.c = [ x.e = 0 ];
        } else {

            // Determine trailing zeros.
            for (; n.charAt(--nL) == '0';) {
            }

            x.e = e - i - 1;
            x.c = [];

            // Convert string to array of digits without leading/trailing zeros.
            for (e = 0; i <= nL; x.c[e++] = +n.charAt(i++)) {
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

    //Browser.
    } else {
        global.Big = Big;
    }
})(this);

},{}],140:[function(require,module,exports){
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

},{}]},{},[105])(105)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9nZW5pc2guanMvanMvYWJzLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2FjY3VtLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2Fjb3MuanMiLCIuLi9nZW5pc2guanMvanMvYWQuanMiLCIuLi9nZW5pc2guanMvanMvYWRkLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2Fkc3IuanMiLCIuLi9nZW5pc2guanMvanMvYW5kLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2FzaW4uanMiLCIuLi9nZW5pc2guanMvanMvYXRhbi5qcyIsIi4uL2dlbmlzaC5qcy9qcy9hdHRhY2suanMiLCIuLi9nZW5pc2guanMvanMvYmFuZy5qcyIsIi4uL2dlbmlzaC5qcy9qcy9ib29sLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2NlaWwuanMiLCIuLi9nZW5pc2guanMvanMvY2xhbXAuanMiLCIuLi9nZW5pc2guanMvanMvY29zLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2NvdW50ZXIuanMiLCIuLi9nZW5pc2guanMvanMvY3ljbGUuanMiLCIuLi9nZW5pc2guanMvanMvZGF0YS5qcyIsIi4uL2dlbmlzaC5qcy9qcy9kY2Jsb2NrLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2RlY2F5LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2RlbGF5LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2RlbHRhLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2Rpdi5qcyIsIi4uL2dlbmlzaC5qcy9qcy9lbnYuanMiLCIuLi9nZW5pc2guanMvanMvZXEuanMiLCIuLi9nZW5pc2guanMvanMvZXhwLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2Zsb29yLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2ZvbGQuanMiLCIuLi9nZW5pc2guanMvanMvZ2F0ZS5qcyIsIi4uL2dlbmlzaC5qcy9qcy9nZW4uanMiLCIuLi9nZW5pc2guanMvanMvZ3QuanMiLCIuLi9nZW5pc2guanMvanMvZ3RlLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2d0cC5qcyIsIi4uL2dlbmlzaC5qcy9qcy9oaXN0b3J5LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2lmZWxzZWlmLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2luLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2luZGV4LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2x0LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL2x0ZS5qcyIsIi4uL2dlbmlzaC5qcy9qcy9sdHAuanMiLCIuLi9nZW5pc2guanMvanMvbWF4LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL21lbW8uanMiLCIuLi9nZW5pc2guanMvanMvbWluLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL21peC5qcyIsIi4uL2dlbmlzaC5qcy9qcy9tb2QuanMiLCIuLi9nZW5pc2guanMvanMvbXN0b3NhbXBzLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL210b2YuanMiLCIuLi9nZW5pc2guanMvanMvbXVsLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL25lcS5qcyIsIi4uL2dlbmlzaC5qcy9qcy9ub2lzZS5qcyIsIi4uL2dlbmlzaC5qcy9qcy9ub3QuanMiLCIuLi9nZW5pc2guanMvanMvcGFuLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3BhcmFtLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3BlZWsuanMiLCIuLi9nZW5pc2guanMvanMvcGhhc29yLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3Bva2UuanMiLCIuLi9nZW5pc2guanMvanMvcG93LmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3JhdGUuanMiLCIuLi9nZW5pc2guanMvanMvcm91bmQuanMiLCIuLi9nZW5pc2guanMvanMvc2FoLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3NlbGVjdG9yLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3NpZ24uanMiLCIuLi9nZW5pc2guanMvanMvc2luLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3NsaWRlLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3N1Yi5qcyIsIi4uL2dlbmlzaC5qcy9qcy9zd2l0Y2guanMiLCIuLi9nZW5pc2guanMvanMvdDYwLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3Rhbi5qcyIsIi4uL2dlbmlzaC5qcy9qcy90YW5oLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3RyYWluLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3V0aWxpdGllcy5qcyIsIi4uL2dlbmlzaC5qcy9qcy93aW5kb3dzLmpzIiwiLi4vZ2VuaXNoLmpzL2pzL3dyYXAuanMiLCJqcy9hbmFseXNpcy9hbmFseXplci5qcyIsImpzL2FuYWx5c2lzL2FuYWx5emVycy5qcyIsImpzL2FuYWx5c2lzL2ZvbGxvdy5qcyIsImpzL2FuYWx5c2lzL3NpbmdsZXNhbXBsZWRlbGF5LmpzIiwianMvZW52ZWxvcGVzL2FkLmpzIiwianMvZW52ZWxvcGVzL2Fkc3IuanMiLCJqcy9lbnZlbG9wZXMvZW52ZWxvcGVzLmpzIiwianMvZW52ZWxvcGVzL3JhbXAuanMiLCJqcy9leHRlcm5hbC9wcmlvcml0eXF1ZXVlLmpzIiwianMvZmlsdGVycy9hbGxwYXNzLmpzIiwianMvZmlsdGVycy9iaXF1YWQuanMiLCJqcy9maWx0ZXJzL2NvbWJmaWx0ZXIuanMiLCJqcy9maWx0ZXJzL2Rpb2RlRmlsdGVyWkRGLmpzIiwianMvZmlsdGVycy9maWx0ZXIuanMiLCJqcy9maWx0ZXJzL2ZpbHRlcjI0LmpzIiwianMvZmlsdGVycy9maWx0ZXJzLmpzIiwianMvZmlsdGVycy9sYWRkZXJGaWx0ZXJaZXJvRGVsYXkuanMiLCJqcy9maWx0ZXJzL3N2Zi5qcyIsImpzL2Z4L2JpdENydXNoZXIuanMiLCJqcy9meC9idWZmZXJTaHVmZmxlci5qcyIsImpzL2Z4L2Nob3J1cy5qcyIsImpzL2Z4L2RhdHRvcnJvLmpzIiwianMvZngvZGVsYXkuanMiLCJqcy9meC9kaXN0b3J0aW9uLmpzIiwianMvZngvZWZmZWN0LmpzIiwianMvZngvZWZmZWN0cy5qcyIsImpzL2Z4L2ZsYW5nZXIuanMiLCJqcy9meC9mcmVldmVyYi5qcyIsImpzL2Z4L3JpbmdNb2QuanMiLCJqcy9meC90cmVtb2xvLmpzIiwianMvZngvdmlicmF0by5qcyIsImpzL2luZGV4LmpzIiwianMvaW5zdHJ1bWVudHMvY29uZ2EuanMiLCJqcy9pbnN0cnVtZW50cy9jb3diZWxsLmpzIiwianMvaW5zdHJ1bWVudHMvZm0uanMiLCJqcy9pbnN0cnVtZW50cy9oYXQuanMiLCJqcy9pbnN0cnVtZW50cy9pbnN0cnVtZW50LmpzIiwianMvaW5zdHJ1bWVudHMvaW5zdHJ1bWVudHMuanMiLCJqcy9pbnN0cnVtZW50cy9rYXJwbHVzc3Ryb25nLmpzIiwianMvaW5zdHJ1bWVudHMva2ljay5qcyIsImpzL2luc3RydW1lbnRzL21vbm9zeW50aC5qcyIsImpzL2luc3RydW1lbnRzL3BvbHlNaXhpbi5qcyIsImpzL2luc3RydW1lbnRzL3BvbHl0ZW1wbGF0ZS5qcyIsImpzL2luc3RydW1lbnRzL3NhbXBsZXIuanMiLCJqcy9pbnN0cnVtZW50cy9zbmFyZS5qcyIsImpzL2luc3RydW1lbnRzL3N5bnRoLmpzIiwianMvaW5zdHJ1bWVudHMvdG9tLmpzIiwianMvbWlzYy9iaW5vcHMuanMiLCJqcy9taXNjL2J1cy5qcyIsImpzL21pc2MvYnVzMi5qcyIsImpzL21pc2MvbW9ub3BzLmpzIiwianMvbWlzYy9wYW5uZXIuanMiLCJqcy9taXNjL3RpbWUuanMiLCJqcy9vc2NpbGxhdG9ycy9icm93bm5vaXNlLmpzIiwianMvb3NjaWxsYXRvcnMvZm1mZWVkYmFja29zYy5qcyIsImpzL29zY2lsbGF0b3JzL29zY2lsbGF0b3JzLmpzIiwianMvb3NjaWxsYXRvcnMvcGlua25vaXNlLmpzIiwianMvb3NjaWxsYXRvcnMvd2F2ZXRhYmxlLmpzIiwianMvc2NoZWR1bGluZy9zY2hlZHVsZXIuanMiLCJqcy9zY2hlZHVsaW5nL3NlcTIuanMiLCJqcy9zY2hlZHVsaW5nL3NlcXVlbmNlci5qcyIsImpzL3VnZW4uanMiLCJqcy91Z2VuVGVtcGxhdGUuanMiLCJqcy91dGlsaXRpZXMuanMiLCJqcy93b3JrbGV0UHJveHkuanMiLCJub2RlX21vZHVsZXMvYmlnLmpzL2JpZy5qcyIsIm5vZGVfbW9kdWxlcy9zZXJpYWxpemUtamF2YXNjcmlwdC9pbmRleC5qcyIsIi4uL21lbW9yeS1oZWxwZXIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdG5DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J2FicycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBNYXRoLmFicyB9KVxuXG4gICAgICBvdXQgPSBgZ2VuLmFicyggJHtpbnB1dHNbMF19IClgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5hYnMoIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBhYnMgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgYWJzLmlucHV0cyA9IFsgeCBdXG5cbiAgcmV0dXJuIGFic1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidhY2N1bScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb2RlLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIGdlbk5hbWUgPSAnZ2VuLicgKyB0aGlzLm5hbWUsXG4gICAgICAgIGZ1bmN0aW9uQm9keVxuXG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcblxuICAgIGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF0gPSB0aGlzLmluaXRpYWxWYWx1ZVxuXG4gICAgZnVuY3Rpb25Cb2R5ID0gdGhpcy5jYWxsYmFjayggZ2VuTmFtZSwgaW5wdXRzWzBdLCBpbnB1dHNbMV0sIGBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XWAgKVxuXG4gICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IHRoaXMgfSkgXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWUgKyAnX3ZhbHVlJ1xuICAgIFxuICAgIHJldHVybiBbIHRoaXMubmFtZSArICdfdmFsdWUnLCBmdW5jdGlvbkJvZHkgXVxuICB9LFxuXG4gIGNhbGxiYWNrKCBfbmFtZSwgX2luY3IsIF9yZXNldCwgdmFsdWVSZWYgKSB7XG4gICAgbGV0IGRpZmYgPSB0aGlzLm1heCAtIHRoaXMubWluLFxuICAgICAgICBvdXQgPSAnJyxcbiAgICAgICAgd3JhcCA9ICcnXG4gICAgXG4gICAgLyogdGhyZWUgZGlmZmVyZW50IG1ldGhvZHMgb2Ygd3JhcHBpbmcsIHRoaXJkIGlzIG1vc3QgZXhwZW5zaXZlOlxuICAgICAqXG4gICAgICogMTogcmFuZ2UgezAsMX06IHkgPSB4IC0gKHggfCAwKVxuICAgICAqIDI6IGxvZzIodGhpcy5tYXgpID09IGludGVnZXI6IHkgPSB4ICYgKHRoaXMubWF4IC0gMSlcbiAgICAgKiAzOiBhbGwgb3RoZXJzOiBpZiggeCA+PSB0aGlzLm1heCApIHkgPSB0aGlzLm1heCAteFxuICAgICAqXG4gICAgICovXG5cbiAgICAvLyBtdXN0IGNoZWNrIGZvciByZXNldCBiZWZvcmUgc3RvcmluZyB2YWx1ZSBmb3Igb3V0cHV0XG4gICAgaWYoICEodHlwZW9mIHRoaXMuaW5wdXRzWzFdID09PSAnbnVtYmVyJyAmJiB0aGlzLmlucHV0c1sxXSA8IDEpICkgeyBcbiAgICAgIGlmKCB0aGlzLnJlc2V0VmFsdWUgIT09IHRoaXMubWluICkge1xuXG4gICAgICAgIG91dCArPSBgICBpZiggJHtfcmVzZXR9ID49MSApICR7dmFsdWVSZWZ9ID0gJHt0aGlzLnJlc2V0VmFsdWV9XFxuXFxuYFxuICAgICAgICAvL291dCArPSBgICBpZiggJHtfcmVzZXR9ID49MSApICR7dmFsdWVSZWZ9ID0gJHt0aGlzLm1pbn1cXG5cXG5gXG4gICAgICB9ZWxzZXtcbiAgICAgICAgb3V0ICs9IGAgIGlmKCAke19yZXNldH0gPj0xICkgJHt2YWx1ZVJlZn0gPSAke3RoaXMubWlufVxcblxcbmBcbiAgICAgICAgLy9vdXQgKz0gYCAgaWYoICR7X3Jlc2V0fSA+PTEgKSAke3ZhbHVlUmVmfSA9ICR7dGhpcy5pbml0aWFsVmFsdWV9XFxuXFxuYFxuICAgICAgfVxuICAgIH1cblxuICAgIG91dCArPSBgICB2YXIgJHt0aGlzLm5hbWV9X3ZhbHVlID0gJHt2YWx1ZVJlZn1cXG5gXG4gICAgXG4gICAgaWYoIHRoaXMuc2hvdWxkV3JhcCA9PT0gZmFsc2UgJiYgdGhpcy5zaG91bGRDbGFtcCA9PT0gdHJ1ZSApIHtcbiAgICAgIG91dCArPSBgICBpZiggJHt2YWx1ZVJlZn0gPCAke3RoaXMubWF4IH0gKSAke3ZhbHVlUmVmfSArPSAke19pbmNyfVxcbmBcbiAgICB9ZWxzZXtcbiAgICAgIG91dCArPSBgICAke3ZhbHVlUmVmfSArPSAke19pbmNyfVxcbmAgLy8gc3RvcmUgb3V0cHV0IHZhbHVlIGJlZm9yZSBhY2N1bXVsYXRpbmcgIFxuICAgIH1cblxuICAgIGlmKCB0aGlzLm1heCAhPT0gSW5maW5pdHkgICYmIHRoaXMuc2hvdWxkV3JhcE1heCApIHdyYXAgKz0gYCAgaWYoICR7dmFsdWVSZWZ9ID49ICR7dGhpcy5tYXh9ICkgJHt2YWx1ZVJlZn0gLT0gJHtkaWZmfVxcbmBcbiAgICBpZiggdGhpcy5taW4gIT09IC1JbmZpbml0eSAmJiB0aGlzLnNob3VsZFdyYXBNaW4gKSB3cmFwICs9IGAgIGlmKCAke3ZhbHVlUmVmfSA8ICR7dGhpcy5taW59ICkgJHt2YWx1ZVJlZn0gKz0gJHtkaWZmfVxcbmBcblxuICAgIC8vaWYoIHRoaXMubWluID09PSAwICYmIHRoaXMubWF4ID09PSAxICkgeyBcbiAgICAvLyAgd3JhcCA9ICBgICAke3ZhbHVlUmVmfSA9ICR7dmFsdWVSZWZ9IC0gKCR7dmFsdWVSZWZ9IHwgMClcXG5cXG5gXG4gICAgLy99IGVsc2UgaWYoIHRoaXMubWluID09PSAwICYmICggTWF0aC5sb2cyKCB0aGlzLm1heCApIHwgMCApID09PSBNYXRoLmxvZzIoIHRoaXMubWF4ICkgKSB7XG4gICAgLy8gIHdyYXAgPSAgYCAgJHt2YWx1ZVJlZn0gPSAke3ZhbHVlUmVmfSAmICgke3RoaXMubWF4fSAtIDEpXFxuXFxuYFxuICAgIC8vfSBlbHNlIGlmKCB0aGlzLm1heCAhPT0gSW5maW5pdHkgKXtcbiAgICAvLyAgd3JhcCA9IGAgIGlmKCAke3ZhbHVlUmVmfSA+PSAke3RoaXMubWF4fSApICR7dmFsdWVSZWZ9IC09ICR7ZGlmZn1cXG5cXG5gXG4gICAgLy99XG5cbiAgICBvdXQgPSBvdXQgKyB3cmFwICsgJ1xcbidcblxuICAgIHJldHVybiBvdXRcbiAgfSxcblxuICBkZWZhdWx0cyA6IHsgbWluOjAsIG1heDoxLCByZXNldFZhbHVlOjAsIGluaXRpYWxWYWx1ZTowLCBzaG91bGRXcmFwOnRydWUsIHNob3VsZFdyYXBNYXg6IHRydWUsIHNob3VsZFdyYXBNaW46dHJ1ZSwgc2hvdWxkQ2xhbXA6ZmFsc2UgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW5jciwgcmVzZXQ9MCwgcHJvcGVydGllcyApID0+IHtcbiAgY29uc3QgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgICAgIFxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCBcbiAgICB7IFxuICAgICAgdWlkOiAgICBnZW4uZ2V0VUlEKCksXG4gICAgICBpbnB1dHM6IFsgaW5jciwgcmVzZXQgXSxcbiAgICAgIG1lbW9yeToge1xuICAgICAgICB2YWx1ZTogeyBsZW5ndGg6MSwgaWR4Om51bGwgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcHJvdG8uZGVmYXVsdHMsXG4gICAgcHJvcGVydGllcyBcbiAgKVxuXG4gIGlmKCBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgJiYgcHJvcGVydGllcy5zaG91bGRXcmFwTWF4ID09PSB1bmRlZmluZWQgJiYgcHJvcGVydGllcy5zaG91bGRXcmFwTWluID09PSB1bmRlZmluZWQgKSB7XG4gICAgaWYoIHByb3BlcnRpZXMuc2hvdWxkV3JhcCAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgdWdlbi5zaG91bGRXcmFwTWluID0gdWdlbi5zaG91bGRXcmFwTWF4ID0gcHJvcGVydGllcy5zaG91bGRXcmFwXG4gICAgfVxuICB9XG5cbiAgaWYoIHByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCAmJiBwcm9wZXJ0aWVzLnJlc2V0VmFsdWUgPT09IHVuZGVmaW5lZCApIHtcbiAgICB1Z2VuLnJlc2V0VmFsdWUgPSB1Z2VuLm1pblxuICB9XG5cbiAgaWYoIHVnZW4uaW5pdGlhbFZhbHVlID09PSB1bmRlZmluZWQgKSB1Z2VuLmluaXRpYWxWYWx1ZSA9IHVnZW4ubWluXG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB1Z2VuLCAndmFsdWUnLCB7XG4gICAgZ2V0KCkgIHsgXG4gICAgICAvL2NvbnNvbGUubG9nKCAnZ2VuOicsIGdlbiwgZ2VuLm1lbW9yeSApXG4gICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSBcbiAgICB9LFxuICAgIHNldCh2KSB7IGdlbi5tZW1vcnkuaGVhcFsgdGhpcy5tZW1vcnkudmFsdWUuaWR4IF0gPSB2IH1cbiAgfSlcblxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2Fjb3MnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICBcbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7ICdhY29zJzogTWF0aC5hY29zIH0pXG5cbiAgICAgIG91dCA9IGBnZW4uYWNvcyggJHtpbnB1dHNbMF19IClgIFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGguYWNvcyggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGFjb3MgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgYWNvcy5pbnB1dHMgPSBbIHggXVxuICBhY29zLmlkID0gZ2VuLmdldFVJRCgpXG4gIGFjb3MubmFtZSA9IGAke2Fjb3MuYmFzZW5hbWV9e2Fjb3MuaWR9YFxuXG4gIHJldHVybiBhY29zXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIG11bCAgICAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIHN1YiAgICAgID0gcmVxdWlyZSggJy4vc3ViLmpzJyApLFxuICAgIGRpdiAgICAgID0gcmVxdWlyZSggJy4vZGl2LmpzJyApLFxuICAgIGRhdGEgICAgID0gcmVxdWlyZSggJy4vZGF0YS5qcycgKSxcbiAgICBwZWVrICAgICA9IHJlcXVpcmUoICcuL3BlZWsuanMnICksXG4gICAgYWNjdW0gICAgPSByZXF1aXJlKCAnLi9hY2N1bS5qcycgKSxcbiAgICBpZmVsc2UgICA9IHJlcXVpcmUoICcuL2lmZWxzZWlmLmpzJyApLFxuICAgIGx0ICAgICAgID0gcmVxdWlyZSggJy4vbHQuanMnICksXG4gICAgYmFuZyAgICAgPSByZXF1aXJlKCAnLi9iYW5nLmpzJyApLFxuICAgIGVudiAgICAgID0gcmVxdWlyZSggJy4vZW52LmpzJyApLFxuICAgIGFkZCAgICAgID0gcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICAgIHBva2UgICAgID0gcmVxdWlyZSggJy4vcG9rZS5qcycgKSxcbiAgICBuZXEgICAgICA9IHJlcXVpcmUoICcuL25lcS5qcycgKSxcbiAgICBhbmQgICAgICA9IHJlcXVpcmUoICcuL2FuZC5qcycgKSxcbiAgICBndGUgICAgICA9IHJlcXVpcmUoICcuL2d0ZS5qcycgKSxcbiAgICBtZW1vICAgICA9IHJlcXVpcmUoICcuL21lbW8uanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSAoIGF0dGFja1RpbWUgPSA0NDEwMCwgZGVjYXlUaW1lID0gNDQxMDAsIF9wcm9wcyApID0+IHtcbiAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB7IHNoYXBlOidleHBvbmVudGlhbCcsIGFscGhhOjUsIHRyaWdnZXI6bnVsbCB9LCBfcHJvcHMgKVxuICBjb25zdCBfYmFuZyA9IHByb3BzLnRyaWdnZXIgIT09IG51bGwgPyBwcm9wcy50cmlnZ2VyIDogYmFuZygpLFxuICAgICAgICBwaGFzZSA9IGFjY3VtKCAxLCBfYmFuZywgeyBtaW46MCwgbWF4OiBJbmZpbml0eSwgaW5pdGlhbFZhbHVlOi1JbmZpbml0eSwgc2hvdWxkV3JhcDpmYWxzZSB9KVxuICAgICAgXG4gIGxldCBidWZmZXJEYXRhLCBidWZmZXJEYXRhUmV2ZXJzZSwgZGVjYXlEYXRhLCBvdXQsIGJ1ZmZlclxuXG4gIC8vY29uc29sZS5sb2coICdzaGFwZTonLCBwcm9wcy5zaGFwZSwgJ2F0dGFjayB0aW1lOicsIGF0dGFja1RpbWUsICdkZWNheSB0aW1lOicsIGRlY2F5VGltZSApXG4gIGxldCBjb21wbGV0ZUZsYWcgPSBkYXRhKCBbMF0gKVxuICBcbiAgLy8gc2xpZ2h0bHkgbW9yZSBlZmZpY2llbnQgdG8gdXNlIGV4aXN0aW5nIHBoYXNlIGFjY3VtdWxhdG9yIGZvciBsaW5lYXIgZW52ZWxvcGVzXG4gIGlmKCBwcm9wcy5zaGFwZSA9PT0gJ2xpbmVhcicgKSB7XG4gICAgb3V0ID0gaWZlbHNlKCBcbiAgICAgIGFuZCggZ3RlKCBwaGFzZSwgMCksIGx0KCBwaGFzZSwgYXR0YWNrVGltZSApKSxcbiAgICAgIGRpdiggcGhhc2UsIGF0dGFja1RpbWUgKSxcblxuICAgICAgYW5kKCBndGUoIHBoYXNlLCAwKSwgIGx0KCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUgKSApICksXG4gICAgICBzdWIoIDEsIGRpdiggc3ViKCBwaGFzZSwgYXR0YWNrVGltZSApLCBkZWNheVRpbWUgKSApLFxuICAgICAgXG4gICAgICBuZXEoIHBoYXNlLCAtSW5maW5pdHkpLFxuICAgICAgcG9rZSggY29tcGxldGVGbGFnLCAxLCAwLCB7IGlubGluZTowIH0pLFxuXG4gICAgICAwIFxuICAgIClcbiAgfSBlbHNlIHtcbiAgICBidWZmZXJEYXRhID0gZW52KHsgbGVuZ3RoOjEwMjQsIHR5cGU6cHJvcHMuc2hhcGUsIGFscGhhOnByb3BzLmFscGhhIH0pXG4gICAgYnVmZmVyRGF0YVJldmVyc2UgPSBlbnYoeyBsZW5ndGg6MTAyNCwgdHlwZTpwcm9wcy5zaGFwZSwgYWxwaGE6cHJvcHMuYWxwaGEsIHJldmVyc2U6dHJ1ZSB9KVxuXG4gICAgb3V0ID0gaWZlbHNlKCBcbiAgICAgIGFuZCggZ3RlKCBwaGFzZSwgMCksIGx0KCBwaGFzZSwgYXR0YWNrVGltZSApICksIFxuICAgICAgcGVlayggYnVmZmVyRGF0YSwgZGl2KCBwaGFzZSwgYXR0YWNrVGltZSApLCB7IGJvdW5kbW9kZTonY2xhbXAnIH0gKSwgXG5cbiAgICAgIGFuZCggZ3RlKHBoYXNlLDApLCBsdCggcGhhc2UsIGFkZCggYXR0YWNrVGltZSwgZGVjYXlUaW1lICkgKSApLCBcbiAgICAgIHBlZWsoIGJ1ZmZlckRhdGFSZXZlcnNlLCBkaXYoIHN1YiggcGhhc2UsIGF0dGFja1RpbWUgKSwgZGVjYXlUaW1lICksIHsgYm91bmRtb2RlOidjbGFtcCcgfSksXG5cbiAgICAgIG5lcSggcGhhc2UsIC1JbmZpbml0eSApLFxuICAgICAgcG9rZSggY29tcGxldGVGbGFnLCAxLCAwLCB7IGlubGluZTowIH0pLFxuXG4gICAgICAwXG4gICAgKVxuICB9XG5cbiAgb3V0LmlzQ29tcGxldGUgPSAoKT0+IGdlbi5tZW1vcnkuaGVhcFsgY29tcGxldGVGbGFnLm1lbW9yeS52YWx1ZXMuaWR4IF1cblxuICBvdXQudHJpZ2dlciA9ICgpPT4ge1xuICAgIGdlbi5tZW1vcnkuaGVhcFsgY29tcGxldGVGbGFnLm1lbW9yeS52YWx1ZXMuaWR4IF0gPSAwXG4gICAgX2JhbmcudHJpZ2dlcigpXG4gIH1cblxuICByZXR1cm4gb3V0IFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxuY29uc3QgcHJvdG8gPSB7IFxuICBiYXNlbmFtZTonYWRkJyxcbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dD0nJyxcbiAgICAgICAgc3VtID0gMCwgbnVtQ291bnQgPSAwLCBhZGRlckF0RW5kID0gZmFsc2UsIGFscmVhZHlGdWxsU3VtbWVkID0gdHJ1ZVxuXG4gICAgaWYoIGlucHV0cy5sZW5ndGggPT09IDAgKSByZXR1cm4gMFxuXG4gICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9IGBcblxuICAgIGlucHV0cy5mb3JFYWNoKCAodixpKSA9PiB7XG4gICAgICBpZiggaXNOYU4oIHYgKSApIHtcbiAgICAgICAgb3V0ICs9IHZcbiAgICAgICAgaWYoIGkgPCBpbnB1dHMubGVuZ3RoIC0xICkge1xuICAgICAgICAgIGFkZGVyQXRFbmQgPSB0cnVlXG4gICAgICAgICAgb3V0ICs9ICcgKyAnXG4gICAgICAgIH1cbiAgICAgICAgYWxyZWFkeUZ1bGxTdW1tZWQgPSBmYWxzZVxuICAgICAgfWVsc2V7XG4gICAgICAgIHN1bSArPSBwYXJzZUZsb2F0KCB2IClcbiAgICAgICAgbnVtQ291bnQrK1xuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiggbnVtQ291bnQgPiAwICkge1xuICAgICAgb3V0ICs9IGFkZGVyQXRFbmQgfHwgYWxyZWFkeUZ1bGxTdW1tZWQgPyBzdW0gOiAnICsgJyArIHN1bVxuICAgIH1cblxuICAgIG91dCArPSAnXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsIG91dCBdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIC4uLmFyZ3MgKSA9PiB7XG4gIGNvbnN0IGFkZCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgYWRkLmlkID0gZ2VuLmdldFVJRCgpXG4gIGFkZC5uYW1lID0gYWRkLmJhc2VuYW1lICsgYWRkLmlkXG4gIGFkZC5pbnB1dHMgPSBhcmdzXG5cbiAgcmV0dXJuIGFkZFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBtdWwgICAgICA9IHJlcXVpcmUoICcuL211bC5qcycgKSxcbiAgICBzdWIgICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKSxcbiAgICBkaXYgICAgICA9IHJlcXVpcmUoICcuL2Rpdi5qcycgKSxcbiAgICBkYXRhICAgICA9IHJlcXVpcmUoICcuL2RhdGEuanMnICksXG4gICAgcGVlayAgICAgPSByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICAgIGFjY3VtICAgID0gcmVxdWlyZSggJy4vYWNjdW0uanMnICksXG4gICAgaWZlbHNlICAgPSByZXF1aXJlKCAnLi9pZmVsc2VpZi5qcycgKSxcbiAgICBsdCAgICAgICA9IHJlcXVpcmUoICcuL2x0LmpzJyApLFxuICAgIGJhbmcgICAgID0gcmVxdWlyZSggJy4vYmFuZy5qcycgKSxcbiAgICBlbnYgICAgICA9IHJlcXVpcmUoICcuL2Vudi5qcycgKSxcbiAgICBwYXJhbSAgICA9IHJlcXVpcmUoICcuL3BhcmFtLmpzJyApLFxuICAgIGFkZCAgICAgID0gcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICAgIGd0cCAgICAgID0gcmVxdWlyZSggJy4vZ3RwLmpzJyApLFxuICAgIG5vdCAgICAgID0gcmVxdWlyZSggJy4vbm90LmpzJyApLFxuICAgIGFuZCAgICAgID0gcmVxdWlyZSggJy4vYW5kLmpzJyApLFxuICAgIG5lcSAgICAgID0gcmVxdWlyZSggJy4vbmVxLmpzJyApLFxuICAgIHBva2UgICAgID0gcmVxdWlyZSggJy4vcG9rZS5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggYXR0YWNrVGltZT00NCwgZGVjYXlUaW1lPTIyMDUwLCBzdXN0YWluVGltZT00NDEwMCwgc3VzdGFpbkxldmVsPS42LCByZWxlYXNlVGltZT00NDEwMCwgX3Byb3BzICkgPT4ge1xuICBsZXQgZW52VHJpZ2dlciA9IGJhbmcoKSxcbiAgICAgIHBoYXNlID0gYWNjdW0oIDEsIGVudlRyaWdnZXIsIHsgbWF4OiBJbmZpbml0eSwgc2hvdWxkV3JhcDpmYWxzZSwgaW5pdGlhbFZhbHVlOkluZmluaXR5IH0pLFxuICAgICAgc2hvdWxkU3VzdGFpbiA9IHBhcmFtKCAxICksXG4gICAgICBkZWZhdWx0cyA9IHtcbiAgICAgICAgIHNoYXBlOiAnZXhwb25lbnRpYWwnLFxuICAgICAgICAgYWxwaGE6IDUsXG4gICAgICAgICB0cmlnZ2VyUmVsZWFzZTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgX3Byb3BzICksXG4gICAgICBidWZmZXJEYXRhLCBkZWNheURhdGEsIG91dCwgYnVmZmVyLCBzdXN0YWluQ29uZGl0aW9uLCByZWxlYXNlQWNjdW0sIHJlbGVhc2VDb25kaXRpb25cblxuXG4gIGNvbnN0IGNvbXBsZXRlRmxhZyA9IGRhdGEoIFswXSApXG5cbiAgYnVmZmVyRGF0YSA9IGVudih7IGxlbmd0aDoxMDI0LCBhbHBoYTpwcm9wcy5hbHBoYSwgc2hpZnQ6MCwgdHlwZTpwcm9wcy5zaGFwZSB9KVxuXG4gIHN1c3RhaW5Db25kaXRpb24gPSBwcm9wcy50cmlnZ2VyUmVsZWFzZSBcbiAgICA/IHNob3VsZFN1c3RhaW5cbiAgICA6IGx0KCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUsIHN1c3RhaW5UaW1lICkgKVxuXG4gIHJlbGVhc2VBY2N1bSA9IHByb3BzLnRyaWdnZXJSZWxlYXNlXG4gICAgPyBndHAoIHN1Yiggc3VzdGFpbkxldmVsLCBhY2N1bSggZGl2KCBzdXN0YWluTGV2ZWwsIHJlbGVhc2VUaW1lICkgLCAwLCB7IHNob3VsZFdyYXA6ZmFsc2UgfSkgKSwgMCApXG4gICAgOiBzdWIoIHN1c3RhaW5MZXZlbCwgbXVsKCBkaXYoIHN1YiggcGhhc2UsIGFkZCggYXR0YWNrVGltZSwgZGVjYXlUaW1lLCBzdXN0YWluVGltZSApICksIHJlbGVhc2VUaW1lICksIHN1c3RhaW5MZXZlbCApICksIFxuXG4gIHJlbGVhc2VDb25kaXRpb24gPSBwcm9wcy50cmlnZ2VyUmVsZWFzZVxuICAgID8gbm90KCBzaG91bGRTdXN0YWluIClcbiAgICA6IGx0KCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUsIHN1c3RhaW5UaW1lLCByZWxlYXNlVGltZSApIClcblxuICBvdXQgPSBpZmVsc2UoXG4gICAgLy8gYXR0YWNrIFxuICAgIGx0KCBwaGFzZSwgIGF0dGFja1RpbWUgKSwgXG4gICAgcGVlayggYnVmZmVyRGF0YSwgZGl2KCBwaGFzZSwgYXR0YWNrVGltZSApLCB7IGJvdW5kbW9kZTonY2xhbXAnIH0gKSwgXG5cbiAgICAvLyBkZWNheVxuICAgIGx0KCBwaGFzZSwgYWRkKCBhdHRhY2tUaW1lLCBkZWNheVRpbWUgKSApLCBcbiAgICBwZWVrKCBidWZmZXJEYXRhLCBzdWIoIDEsIG11bCggZGl2KCBzdWIoIHBoYXNlLCAgYXR0YWNrVGltZSApLCAgZGVjYXlUaW1lICksIHN1YiggMSwgIHN1c3RhaW5MZXZlbCApICkgKSwgeyBib3VuZG1vZGU6J2NsYW1wJyB9KSxcblxuICAgIC8vIHN1c3RhaW5cbiAgICBhbmQoIHN1c3RhaW5Db25kaXRpb24sIG5lcSggcGhhc2UsIEluZmluaXR5ICkgKSxcbiAgICBwZWVrKCBidWZmZXJEYXRhLCAgc3VzdGFpbkxldmVsICksXG5cbiAgICAvLyByZWxlYXNlXG4gICAgcmVsZWFzZUNvbmRpdGlvbiwgLy9sdCggcGhhc2UsICBhdHRhY2tUaW1lICsgIGRlY2F5VGltZSArICBzdXN0YWluVGltZSArICByZWxlYXNlVGltZSApLFxuICAgIHBlZWsoIFxuICAgICAgYnVmZmVyRGF0YSxcbiAgICAgIHJlbGVhc2VBY2N1bSwgXG4gICAgICAvL3N1YiggIHN1c3RhaW5MZXZlbCwgbXVsKCBkaXYoIHN1YiggcGhhc2UsICBhdHRhY2tUaW1lICsgIGRlY2F5VGltZSArICBzdXN0YWluVGltZSksICByZWxlYXNlVGltZSApLCAgc3VzdGFpbkxldmVsICkgKSwgXG4gICAgICB7IGJvdW5kbW9kZTonY2xhbXAnIH1cbiAgICApLFxuXG4gICAgbmVxKCBwaGFzZSwgSW5maW5pdHkgKSxcbiAgICBwb2tlKCBjb21wbGV0ZUZsYWcsIDEsIDAsIHsgaW5saW5lOjAgfSksXG5cbiAgICAwXG4gIClcbiAgIFxuICBvdXQudHJpZ2dlciA9ICgpPT4ge1xuICAgIHNob3VsZFN1c3RhaW4udmFsdWUgPSAxXG4gICAgZW52VHJpZ2dlci50cmlnZ2VyKClcbiAgfVxuXG4gIG91dC5pc0NvbXBsZXRlID0gKCk9PiBnZW4ubWVtb3J5LmhlYXBbIGNvbXBsZXRlRmxhZy5tZW1vcnkudmFsdWVzLmlkeCBdXG5cbiAgb3V0LnJlbGVhc2UgPSAoKT0+IHtcbiAgICBzaG91bGRTdXN0YWluLnZhbHVlID0gMFxuICAgIC8vIFhYWCBwcmV0dHkgbmFzdHkuLi4gZ3JhYnMgYWNjdW0gaW5zaWRlIG9mIGd0cCBhbmQgcmVzZXRzIHZhbHVlIG1hbnVhbGx5XG4gICAgLy8gdW5mb3J0dW5hdGVseSBlbnZUcmlnZ2VyIHdvbid0IHdvcmsgYXMgaXQncyBiYWNrIHRvIDAgYnkgdGhlIHRpbWUgdGhlIHJlbGVhc2UgYmxvY2sgaXMgdHJpZ2dlcmVkLi4uXG4gICAgZ2VuLm1lbW9yeS5oZWFwWyByZWxlYXNlQWNjdW0uaW5wdXRzWzBdLmlucHV0c1sxXS5tZW1vcnkudmFsdWUuaWR4IF0gPSAwXG4gIH1cblxuICByZXR1cm4gb3V0IFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonYW5kJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gKCR7aW5wdXRzWzBdfSAhPT0gMCAmJiAke2lucHV0c1sxXX0gIT09IDApIHwgMFxcblxcbmBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGAke3RoaXMubmFtZX1gXG5cbiAgICByZXR1cm4gWyBgJHt0aGlzLm5hbWV9YCwgb3V0IF1cbiAgfSxcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBpbjIgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogIFsgaW4xLCBpbjIgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonYXNpbicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ2FzaW4nOiBNYXRoLmFzaW4gfSlcblxuICAgICAgb3V0ID0gYGdlbi5hc2luKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5hc2luKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgYXNpbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBhc2luLmlucHV0cyA9IFsgeCBdXG4gIGFzaW4uaWQgPSBnZW4uZ2V0VUlEKClcbiAgYXNpbi5uYW1lID0gYCR7YXNpbi5iYXNlbmFtZX17YXNpbi5pZH1gXG5cbiAgcmV0dXJuIGFzaW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonYXRhbicsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ2F0YW4nOiBNYXRoLmF0YW4gfSlcblxuICAgICAgb3V0ID0gYGdlbi5hdGFuKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5hdGFuKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgYXRhbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBhdGFuLmlucHV0cyA9IFsgeCBdXG4gIGF0YW4uaWQgPSBnZW4uZ2V0VUlEKClcbiAgYXRhbi5uYW1lID0gYCR7YXRhbi5iYXNlbmFtZX17YXRhbi5pZH1gXG5cbiAgcmV0dXJuIGF0YW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBoaXN0b3J5ID0gcmVxdWlyZSggJy4vaGlzdG9yeS5qcycgKSxcbiAgICBtdWwgICAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIHN1YiAgICAgPSByZXF1aXJlKCAnLi9zdWIuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSAoIGRlY2F5VGltZSA9IDQ0MTAwICkgPT4ge1xuICBsZXQgc3NkID0gaGlzdG9yeSAoIDEgKSxcbiAgICAgIHQ2MCA9IE1hdGguZXhwKCAtNi45MDc3NTUyNzg5MjEgLyBkZWNheVRpbWUgKVxuXG4gIHNzZC5pbiggbXVsKCBzc2Qub3V0LCB0NjAgKSApXG5cbiAgc3NkLm91dC50cmlnZ2VyID0gKCk9PiB7XG4gICAgc3NkLnZhbHVlID0gMVxuICB9XG5cbiAgcmV0dXJuIHN1YiggMSwgc3NkLm91dCApXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBnZW4oKSB7XG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICBcbiAgICBsZXQgb3V0ID0gXG5gICB2YXIgJHt0aGlzLm5hbWV9ID0gbWVtb3J5WyR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fV1cbiAgaWYoICR7dGhpcy5uYW1lfSA9PT0gMSApIG1lbW9yeVske3RoaXMubWVtb3J5LnZhbHVlLmlkeH1dID0gMCAgICAgIFxuICAgICAgXG5gXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsIG91dCBdXG4gIH0gXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBfcHJvcHMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgeyBtaW46MCwgbWF4OjEgfSwgX3Byb3BzIClcblxuICB1Z2VuLm5hbWUgPSAnYmFuZycgKyBnZW4uZ2V0VUlEKClcblxuICB1Z2VuLm1pbiA9IHByb3BzLm1pblxuICB1Z2VuLm1heCA9IHByb3BzLm1heFxuXG4gIHVnZW4udHJpZ2dlciA9ICgpID0+IHtcbiAgICBnZW4ubWVtb3J5LmhlYXBbIHVnZW4ubWVtb3J5LnZhbHVlLmlkeCBdID0gdWdlbi5tYXggXG4gIH1cblxuICB1Z2VuLm1lbW9yeSA9IHtcbiAgICB2YWx1ZTogeyBsZW5ndGg6MSwgaWR4Om51bGwgfVxuICB9XG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2Jvb2wnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLCBvdXRcblxuICAgIG91dCA9IGAke2lucHV0c1swXX0gPT09IDAgPyAwIDogMWBcbiAgICBcbiAgICAvL2dlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGBnZW4uZGF0YS4ke3RoaXMubmFtZX1gXG5cbiAgICAvL3JldHVybiBbIGBnZW4uZGF0YS4ke3RoaXMubmFtZX1gLCAnICcgK291dCBdXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHsgXG4gICAgdWlkOiAgICAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogICAgIFsgaW4xIF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG5cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidjZWlsJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IE1hdGguY2VpbCB9KVxuXG4gICAgICBvdXQgPSBgZ2VuLmNlaWwoICR7aW5wdXRzWzBdfSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGguY2VpbCggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGNlaWwgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgY2VpbC5pbnB1dHMgPSBbIHggXVxuXG4gIHJldHVybiBjZWlsXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgIGZsb29yPSByZXF1aXJlKCcuL2Zsb29yLmpzJyksXG4gICAgc3ViICA9IHJlcXVpcmUoJy4vc3ViLmpzJyksXG4gICAgbWVtbyA9IHJlcXVpcmUoJy4vbWVtby5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2NsaXAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgY29kZSxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICBvdXRcblxuICAgIG91dCA9XG5cbmAgdmFyICR7dGhpcy5uYW1lfSA9ICR7aW5wdXRzWzBdfVxuICBpZiggJHt0aGlzLm5hbWV9ID4gJHtpbnB1dHNbMl19ICkgJHt0aGlzLm5hbWV9ID0gJHtpbnB1dHNbMl19XG4gIGVsc2UgaWYoICR7dGhpcy5uYW1lfSA8ICR7aW5wdXRzWzFdfSApICR7dGhpcy5uYW1lfSA9ICR7aW5wdXRzWzFdfVxuYFxuICAgIG91dCA9ICcgJyArIG91dFxuICAgIFxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIFsgdGhpcy5uYW1lLCBvdXQgXVxuICB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xLCBtaW49LTEsIG1heD0xICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIG1pbiwgXG4gICAgbWF4LFxuICAgIHVpZDogICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogWyBpbjEsIG1pbiwgbWF4IF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2NvcycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ2Nvcyc6IE1hdGguY29zIH0pXG5cbiAgICAgIG91dCA9IGBnZW4uY29zKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5jb3MoIHBhcnNlRmxvYXQoIGlucHV0c1swXSApIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geCA9PiB7XG4gIGxldCBjb3MgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgY29zLmlucHV0cyA9IFsgeCBdXG4gIGNvcy5pZCA9IGdlbi5nZXRVSUQoKVxuICBjb3MubmFtZSA9IGAke2Nvcy5iYXNlbmFtZX17Y29zLmlkfWBcblxuICByZXR1cm4gY29zXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2NvdW50ZXInLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgY29kZSxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICBnZW5OYW1lID0gJ2dlbi4nICsgdGhpcy5uYW1lLFxuICAgICAgICBmdW5jdGlvbkJvZHlcbiAgICAgICBcbiAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ID09PSBudWxsICkgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICBnZW4ubWVtb3J5LmhlYXBbIHRoaXMubWVtb3J5LnZhbHVlLmlkeCBdID0gdGhpcy5pbml0aWFsVmFsdWVcbiAgICBcbiAgICBmdW5jdGlvbkJvZHkgID0gdGhpcy5jYWxsYmFjayggZ2VuTmFtZSwgaW5wdXRzWzBdLCBpbnB1dHNbMV0sIGlucHV0c1syXSwgaW5wdXRzWzNdLCBpbnB1dHNbNF0sICBgbWVtb3J5WyR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fV1gLCBgbWVtb3J5WyR7dGhpcy5tZW1vcnkud3JhcC5pZHh9XWAgIClcblxuICAgIGdlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiB0aGlzIH0pIFxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lICsgJ192YWx1ZSdcbiAgIFxuICAgIGlmKCBnZW4ubWVtb1sgdGhpcy53cmFwLm5hbWUgXSA9PT0gdW5kZWZpbmVkICkgdGhpcy53cmFwLmdlbigpXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUgKyAnX3ZhbHVlJywgZnVuY3Rpb25Cb2R5IF1cbiAgfSxcblxuICBjYWxsYmFjayggX25hbWUsIF9pbmNyLCBfbWluLCBfbWF4LCBfcmVzZXQsIGxvb3BzLCB2YWx1ZVJlZiwgd3JhcFJlZiApIHtcbiAgICBsZXQgZGlmZiA9IHRoaXMubWF4IC0gdGhpcy5taW4sXG4gICAgICAgIG91dCA9ICcnLFxuICAgICAgICB3cmFwID0gJydcbiAgICAvLyBtdXN0IGNoZWNrIGZvciByZXNldCBiZWZvcmUgc3RvcmluZyB2YWx1ZSBmb3Igb3V0cHV0XG4gICAgaWYoICEodHlwZW9mIHRoaXMuaW5wdXRzWzNdID09PSAnbnVtYmVyJyAmJiB0aGlzLmlucHV0c1szXSA8IDEpICkgeyBcbiAgICAgIG91dCArPSBgICBpZiggJHtfcmVzZXR9ID49IDEgKSAke3ZhbHVlUmVmfSA9ICR7X21pbn1cXG5gXG4gICAgfVxuXG4gICAgb3V0ICs9IGAgIHZhciAke3RoaXMubmFtZX1fdmFsdWUgPSAke3ZhbHVlUmVmfTtcXG4gICR7dmFsdWVSZWZ9ICs9ICR7X2luY3J9XFxuYCAvLyBzdG9yZSBvdXRwdXQgdmFsdWUgYmVmb3JlIGFjY3VtdWxhdGluZyAgXG4gICAgXG4gICAgaWYoIHR5cGVvZiB0aGlzLm1heCA9PT0gJ251bWJlcicgJiYgdGhpcy5tYXggIT09IEluZmluaXR5ICYmIHR5cGVvZiB0aGlzLm1pbiAhPT0gJ251bWJlcicgKSB7XG4gICAgICB3cmFwID0gXG5gICBpZiggJHt2YWx1ZVJlZn0gPj0gJHt0aGlzLm1heH0gJiYgICR7bG9vcHN9ID4gMCkge1xuICAgICR7dmFsdWVSZWZ9IC09ICR7ZGlmZn1cbiAgICAke3dyYXBSZWZ9ID0gMVxuICB9ZWxzZXtcbiAgICAke3dyYXBSZWZ9ID0gMFxuICB9XFxuYFxuICAgIH1lbHNlIGlmKCB0aGlzLm1heCAhPT0gSW5maW5pdHkgJiYgdGhpcy5taW4gIT09IEluZmluaXR5ICkge1xuICAgICAgd3JhcCA9IFxuYCAgaWYoICR7dmFsdWVSZWZ9ID49ICR7X21heH0gJiYgICR7bG9vcHN9ID4gMCkge1xuICAgICR7dmFsdWVSZWZ9IC09ICR7X21heH0gLSAke19taW59XG4gICAgJHt3cmFwUmVmfSA9IDFcbiAgfWVsc2UgaWYoICR7dmFsdWVSZWZ9IDwgJHtfbWlufSAmJiAgJHtsb29wc30gPiAwKSB7XG4gICAgJHt2YWx1ZVJlZn0gKz0gJHtfbWF4fSAtICR7X21pbn1cbiAgICAke3dyYXBSZWZ9ID0gMVxuICB9ZWxzZXtcbiAgICAke3dyYXBSZWZ9ID0gMFxuICB9XFxuYFxuICAgIH1lbHNle1xuICAgICAgb3V0ICs9ICdcXG4nXG4gICAgfVxuXG4gICAgb3V0ID0gb3V0ICsgd3JhcFxuXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbmNyPTEsIG1pbj0wLCBtYXg9SW5maW5pdHksIHJlc2V0PTAsIGxvb3BzPTEsICBwcm9wZXJ0aWVzICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvICksXG4gICAgICBkZWZhdWx0cyA9IE9iamVjdC5hc3NpZ24oIHsgaW5pdGlhbFZhbHVlOiAwLCBzaG91bGRXcmFwOnRydWUgfSwgcHJvcGVydGllcyApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBtaW46ICAgIG1pbiwgXG4gICAgbWF4OiAgICBtYXgsXG4gICAgaW5pdGlhbFZhbHVlOiBkZWZhdWx0cy5pbml0aWFsVmFsdWUsXG4gICAgdmFsdWU6ICBkZWZhdWx0cy5pbml0aWFsVmFsdWUsXG4gICAgdWlkOiAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiBbIGluY3IsIG1pbiwgbWF4LCByZXNldCwgbG9vcHMgXSxcbiAgICBtZW1vcnk6IHtcbiAgICAgIHZhbHVlOiB7IGxlbmd0aDoxLCBpZHg6IG51bGwgfSxcbiAgICAgIHdyYXA6ICB7IGxlbmd0aDoxLCBpZHg6IG51bGwgfSBcbiAgICB9LFxuICAgIHdyYXAgOiB7XG4gICAgICBnZW4oKSB7IFxuICAgICAgICBpZiggdWdlbi5tZW1vcnkud3JhcC5pZHggPT09IG51bGwgKSB7XG4gICAgICAgICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHVnZW4ubWVtb3J5IClcbiAgICAgICAgfVxuICAgICAgICBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcbiAgICAgICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gYG1lbW9yeVsgJHt1Z2VuLm1lbW9yeS53cmFwLmlkeH0gXWBcbiAgICAgICAgcmV0dXJuIGBtZW1vcnlbICR7dWdlbi5tZW1vcnkud3JhcC5pZHh9IF1gIFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZGVmYXVsdHMgKVxuIFxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHVnZW4sICd2YWx1ZScsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ICE9PSBudWxsICkge1xuICAgICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXVxuICAgICAgfVxuICAgIH0sXG4gICAgc2V0KCB2ICkge1xuICAgICAgaWYoIHRoaXMubWVtb3J5LnZhbHVlLmlkeCAhPT0gbnVsbCApIHtcbiAgICAgICAgZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSA9IHYgXG4gICAgICB9XG4gICAgfVxuICB9KVxuICBcbiAgdWdlbi53cmFwLmlucHV0cyA9IFsgdWdlbiBdXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG4gIHVnZW4ud3JhcC5uYW1lID0gdWdlbi5uYW1lICsgJ193cmFwJ1xuICByZXR1cm4gdWdlblxufSBcbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBhY2N1bT0gcmVxdWlyZSggJy4vcGhhc29yLmpzJyApLFxuICAgIGRhdGEgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApLFxuICAgIHBlZWsgPSByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICAgIG11bCAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgcGhhc29yPXJlcXVpcmUoICcuL3BoYXNvci5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2N5Y2xlJyxcblxuICBpbml0VGFibGUoKSB7ICAgIFxuICAgIGxldCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0IClcblxuICAgIGZvciggbGV0IGkgPSAwLCBsID0gYnVmZmVyLmxlbmd0aDsgaSA8IGw7IGkrKyApIHtcbiAgICAgIGJ1ZmZlclsgaSBdID0gTWF0aC5zaW4oICggaSAvIGwgKSAqICggTWF0aC5QSSAqIDIgKSApXG4gICAgfVxuXG4gICAgZ2VuLmdsb2JhbHMuY3ljbGUgPSBkYXRhKCBidWZmZXIsIDEsIHsgaW1tdXRhYmxlOnRydWUgfSApXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggZnJlcXVlbmN5PTEsIHJlc2V0PTAsIF9wcm9wcyApID0+IHtcbiAgaWYoIHR5cGVvZiBnZW4uZ2xvYmFscy5jeWNsZSA9PT0gJ3VuZGVmaW5lZCcgKSBwcm90by5pbml0VGFibGUoKSBcbiAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB7IG1pbjowIH0sIF9wcm9wcyApXG5cbiAgY29uc3QgdWdlbiA9IHBlZWsoIGdlbi5nbG9iYWxzLmN5Y2xlLCBwaGFzb3IoIGZyZXF1ZW5jeSwgcmVzZXQsIHByb3BzICkpXG4gIHVnZW4ubmFtZSA9ICdjeWNsZScgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKSxcbiAgdXRpbGl0aWVzID0gcmVxdWlyZSggJy4vdXRpbGl0aWVzLmpzJyApLFxuICBwZWVrID0gcmVxdWlyZSgnLi9wZWVrLmpzJyksXG4gIHBva2UgPSByZXF1aXJlKCcuL3Bva2UuanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidkYXRhJyxcbiAgZ2xvYmFsczoge30sXG5cbiAgZ2VuKCkge1xuICAgIGxldCBpZHhcbiAgICBpZiggZ2VuLm1lbW9bIHRoaXMubmFtZSBdID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBsZXQgdWdlbiA9IHRoaXNcbiAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSwgdGhpcy5pbW11dGFibGUgKSBcbiAgICAgIGlkeCA9IHRoaXMubWVtb3J5LnZhbHVlcy5pZHhcbiAgICAgIHRyeSB7XG4gICAgICAgIGdlbi5tZW1vcnkuaGVhcC5zZXQoIHRoaXMuYnVmZmVyLCBpZHggKVxuICAgICAgfWNhdGNoKCBlICkge1xuICAgICAgICBjb25zb2xlLmxvZyggZSApXG4gICAgICAgIHRocm93IEVycm9yKCAnZXJyb3Igd2l0aCByZXF1ZXN0LiBhc2tpbmcgZm9yICcgKyB0aGlzLmJ1ZmZlci5sZW5ndGggKycuIGN1cnJlbnQgaW5kZXg6ICcgKyBnZW4ubWVtb3J5SW5kZXggKyAnIG9mICcgKyBnZW4ubWVtb3J5LmhlYXAubGVuZ3RoIClcbiAgICAgIH1cbiAgICAgIC8vZ2VuLmRhdGFbIHRoaXMubmFtZSBdID0gdGhpc1xuICAgICAgLy9yZXR1cm4gJ2dlbi5tZW1vcnknICsgdGhpcy5uYW1lICsgJy5idWZmZXInXG4gICAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBpZHhcbiAgICB9ZWxzZXtcbiAgICAgIGlkeCA9IGdlbi5tZW1vWyB0aGlzLm5hbWUgXVxuICAgIH1cbiAgICByZXR1cm4gaWR4XG4gIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCB4LCB5PTEsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGxldCB1Z2VuLCBidWZmZXIsIHNob3VsZExvYWQgPSBmYWxzZVxuICBcbiAgaWYoIHByb3BlcnRpZXMgIT09IHVuZGVmaW5lZCAmJiBwcm9wZXJ0aWVzLmdsb2JhbCAhPT0gdW5kZWZpbmVkICkge1xuICAgIGlmKCBnZW4uZ2xvYmFsc1sgcHJvcGVydGllcy5nbG9iYWwgXSApIHtcbiAgICAgIHJldHVybiBnZW4uZ2xvYmFsc1sgcHJvcGVydGllcy5nbG9iYWwgXVxuICAgIH1cbiAgfVxuXG4gIGlmKCB0eXBlb2YgeCA9PT0gJ251bWJlcicgKSB7XG4gICAgaWYoIHkgIT09IDEgKSB7XG4gICAgICBidWZmZXIgPSBbXVxuICAgICAgZm9yKCBsZXQgaSA9IDA7IGkgPCB5OyBpKysgKSB7XG4gICAgICAgIGJ1ZmZlclsgaSBdID0gbmV3IEZsb2F0MzJBcnJheSggeCApXG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCB4IClcbiAgICB9XG4gIH1lbHNlIGlmKCBBcnJheS5pc0FycmF5KCB4ICkgKSB7IC8vISAoeCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApICkge1xuICAgIGxldCBzaXplID0geC5sZW5ndGhcbiAgICBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCBzaXplIClcbiAgICBmb3IoIGxldCBpID0gMDsgaSA8IHgubGVuZ3RoOyBpKysgKSB7XG4gICAgICBidWZmZXJbIGkgXSA9IHhbIGkgXVxuICAgIH1cbiAgfWVsc2UgaWYoIHR5cGVvZiB4ID09PSAnc3RyaW5nJyApIHtcbiAgICBidWZmZXIgPSB7IGxlbmd0aDogeSA+IDEgPyB5IDogZ2VuLnNhbXBsZXJhdGUgKiA2MCB9IC8vIFhYWCB3aGF0Pz8/XG4gICAgc2hvdWxkTG9hZCA9IHRydWVcbiAgfWVsc2UgaWYoIHggaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XG4gICAgYnVmZmVyID0geFxuICB9XG4gIFxuICB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHsgXG4gICAgYnVmZmVyLFxuICAgIG5hbWU6IHByb3RvLmJhc2VuYW1lICsgZ2VuLmdldFVJRCgpLFxuICAgIGRpbTogIGJ1ZmZlci5sZW5ndGgsIC8vIFhYWCBob3cgZG8gd2UgZHluYW1pY2FsbHkgYWxsb2NhdGUgdGhpcz9cbiAgICBjaGFubmVscyA6IDEsXG4gICAgb25sb2FkOiBudWxsLFxuICAgIHRoZW4oIGZuYyApIHtcbiAgICAgIHVnZW4ub25sb2FkID0gZm5jXG4gICAgICByZXR1cm4gdWdlblxuICAgIH0sXG4gICAgaW1tdXRhYmxlOiBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgJiYgcHJvcGVydGllcy5pbW11dGFibGUgPT09IHRydWUgPyB0cnVlIDogZmFsc2UsXG4gICAgbG9hZCggZmlsZW5hbWUgKSB7XG4gICAgICBsZXQgcHJvbWlzZSA9IHV0aWxpdGllcy5sb2FkU2FtcGxlKCBmaWxlbmFtZSwgdWdlbiApXG4gICAgICBwcm9taXNlLnRoZW4oICggX2J1ZmZlciApPT4geyBcbiAgICAgICAgdWdlbi5tZW1vcnkudmFsdWVzLmxlbmd0aCA9IHVnZW4uZGltID0gX2J1ZmZlci5sZW5ndGhcbiAgICAgICAgaWYoIHR5cGVvZiB1Z2VuLm9ubG9hZCA9PT0gJ2Z1bmN0aW9uJyApIHVnZW4ub25sb2FkKCkgXG4gICAgICB9KVxuICAgIH0sXG4gICAgbWVtb3J5IDoge1xuICAgICAgdmFsdWVzOiB7IGxlbmd0aDpidWZmZXIubGVuZ3RoLCBpZHg6bnVsbCB9XG4gICAgfVxuICB9KVxuXG4gIGlmKCBzaG91bGRMb2FkICkgdWdlbi5sb2FkKCB4IClcbiAgXG4gIGlmKCBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgKSB7XG4gICAgaWYoIHByb3BlcnRpZXMuZ2xvYmFsICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICBnZW4uZ2xvYmFsc1sgcHJvcGVydGllcy5nbG9iYWwgXSA9IHVnZW5cbiAgICB9XG4gICAgaWYoIHByb3BlcnRpZXMubWV0YSA9PT0gdHJ1ZSApIHtcbiAgICAgIGZvciggbGV0IGkgPSAwLCBsZW5ndGggPSB1Z2VuLmJ1ZmZlci5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB1Z2VuLCBpLCB7XG4gICAgICAgICAgZ2V0ICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWVrKCB1Z2VuLCBpLCB7IG1vZGU6J3NpbXBsZScsIGludGVycDonbm9uZScgfSApXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXQoIHYgKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9rZSggdWdlbiwgdiwgaSApXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgaGlzdG9yeSA9IHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gICAgc3ViICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKSxcbiAgICBhZGQgICAgID0gcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICAgIG11bCAgICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgbWVtbyAgICA9IHJlcXVpcmUoICcuL21lbW8uanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSApID0+IHtcbiAgbGV0IHgxID0gaGlzdG9yeSgpLFxuICAgICAgeTEgPSBoaXN0b3J5KCksXG4gICAgICBmaWx0ZXJcblxuICAvL0hpc3RvcnkgeDEsIHkxOyB5ID0gaW4xIC0geDEgKyB5MSowLjk5OTc7IHgxID0gaW4xOyB5MSA9IHk7IG91dDEgPSB5O1xuICBmaWx0ZXIgPSBtZW1vKCBhZGQoIHN1YiggaW4xLCB4MS5vdXQgKSwgbXVsKCB5MS5vdXQsIC45OTk3ICkgKSApXG4gIHgxLmluKCBpbjEgKVxuICB5MS5pbiggZmlsdGVyIClcblxuICByZXR1cm4gZmlsdGVyXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgaGlzdG9yeSA9IHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gICAgbXVsICAgICA9IHJlcXVpcmUoICcuL211bC5qcycgKSxcbiAgICB0NjAgICAgID0gcmVxdWlyZSggJy4vdDYwLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gKCBkZWNheVRpbWUgPSA0NDEwMCwgcHJvcHMgKSA9PiB7XG4gIGxldCBwcm9wZXJ0aWVzID0gT2JqZWN0LmFzc2lnbih7fSwgeyBpbml0VmFsdWU6MSB9LCBwcm9wcyApLFxuICAgICAgc3NkID0gaGlzdG9yeSAoIHByb3BlcnRpZXMuaW5pdFZhbHVlIClcblxuICBzc2QuaW4oIG11bCggc3NkLm91dCwgdDYwKCBkZWNheVRpbWUgKSApIClcblxuICBzc2Qub3V0LnRyaWdnZXIgPSAoKT0+IHtcbiAgICBzc2QudmFsdWUgPSAxXG4gIH1cblxuICByZXR1cm4gc3NkLm91dCBcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBnZW4gID0gcmVxdWlyZSggJy4vZ2VuLmpzJyAgKSxcbiAgICAgIGRhdGEgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApLFxuICAgICAgcG9rZSA9IHJlcXVpcmUoICcuL3Bva2UuanMnICksXG4gICAgICBwZWVrID0gcmVxdWlyZSggJy4vcGVlay5qcycgKSxcbiAgICAgIHN1YiAgPSByZXF1aXJlKCAnLi9zdWIuanMnICApLFxuICAgICAgd3JhcCA9IHJlcXVpcmUoICcuL3dyYXAuanMnICksXG4gICAgICBhY2N1bT0gcmVxdWlyZSggJy4vYWNjdW0uanMnKSxcbiAgICAgIG1lbW8gPSByZXF1aXJlKCAnLi9tZW1vLmpzJyApXG5cbmNvbnN0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZGVsYXknLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gaW5wdXRzWzBdXG4gICAgXG4gICAgcmV0dXJuIGlucHV0c1swXVxuICB9LFxufVxuXG5jb25zdCBkZWZhdWx0cyA9IHsgc2l6ZTogNTEyLCBpbnRlcnA6J25vbmUnIH1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgdGFwcywgcHJvcGVydGllcyApID0+IHtcbiAgY29uc3QgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgbGV0IHdyaXRlSWR4LCByZWFkSWR4LCBkZWxheWRhdGFcblxuICBpZiggQXJyYXkuaXNBcnJheSggdGFwcyApID09PSBmYWxzZSApIHRhcHMgPSBbIHRhcHMgXVxuICBcbiAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgZGVmYXVsdHMsIHByb3BlcnRpZXMgKVxuXG4gIGNvbnN0IG1heFRhcFNpemUgPSBNYXRoLm1heCggLi4udGFwcyApXG4gIGlmKCBwcm9wcy5zaXplIDwgbWF4VGFwU2l6ZSApIHByb3BzLnNpemUgPSBtYXhUYXBTaXplXG5cbiAgZGVsYXlkYXRhID0gZGF0YSggcHJvcHMuc2l6ZSApXG4gIFxuICB1Z2VuLmlucHV0cyA9IFtdXG5cbiAgd3JpdGVJZHggPSBhY2N1bSggMSwgMCwgeyBtYXg6cHJvcHMuc2l6ZSwgbWluOjAgfSlcbiAgXG4gIGZvciggbGV0IGkgPSAwOyBpIDwgdGFwcy5sZW5ndGg7IGkrKyApIHtcbiAgICB1Z2VuLmlucHV0c1sgaSBdID0gcGVlayggZGVsYXlkYXRhLCB3cmFwKCBzdWIoIHdyaXRlSWR4LCB0YXBzW2ldICksIDAsIHByb3BzLnNpemUgKSx7IG1vZGU6J3NhbXBsZXMnLCBpbnRlcnA6cHJvcHMuaW50ZXJwIH0pXG4gIH1cbiAgXG4gIHVnZW4ub3V0cHV0cyA9IHVnZW4uaW5wdXRzIC8vIFhYWCB1Z2gsIFVnaCwgVUdIISBidXQgaSBndWVzcyBpdCB3b3Jrcy5cblxuICBwb2tlKCBkZWxheWRhdGEsIGluMSwgd3JpdGVJZHggKVxuXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHtnZW4uZ2V0VUlEKCl9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgICAgPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgaGlzdG9yeSA9IHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gICAgc3ViICAgICA9IHJlcXVpcmUoICcuL3N1Yi5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xICkgPT4ge1xuICBsZXQgbjEgPSBoaXN0b3J5KClcbiAgICBcbiAgbjEuaW4oIGluMSApXG5cbiAgbGV0IHVnZW4gPSBzdWIoIGluMSwgbjEub3V0IClcbiAgdWdlbi5uYW1lID0gJ2RlbHRhJytnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmNvbnN0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZGl2JyxcbiAgZ2VuKCkge1xuICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dD1gICB2YXIgJHt0aGlzLm5hbWV9ID0gYCxcbiAgICAgICAgZGlmZiA9IDAsIFxuICAgICAgICBudW1Db3VudCA9IDAsXG4gICAgICAgIGxhc3ROdW1iZXIgPSBpbnB1dHNbIDAgXSxcbiAgICAgICAgbGFzdE51bWJlcklzVWdlbiA9IGlzTmFOKCBsYXN0TnVtYmVyICksIFxuICAgICAgICBkaXZBdEVuZCA9IGZhbHNlXG5cbiAgICBpbnB1dHMuZm9yRWFjaCggKHYsaSkgPT4ge1xuICAgICAgaWYoIGkgPT09IDAgKSByZXR1cm5cblxuICAgICAgbGV0IGlzTnVtYmVyVWdlbiA9IGlzTmFOKCB2ICksXG4gICAgICAgIGlzRmluYWxJZHggICA9IGkgPT09IGlucHV0cy5sZW5ndGggLSAxXG5cbiAgICAgIGlmKCAhbGFzdE51bWJlcklzVWdlbiAmJiAhaXNOdW1iZXJVZ2VuICkge1xuICAgICAgICBsYXN0TnVtYmVyID0gbGFzdE51bWJlciAvIHZcbiAgICAgICAgb3V0ICs9IGxhc3ROdW1iZXJcbiAgICAgIH1lbHNle1xuICAgICAgICBvdXQgKz0gYCR7bGFzdE51bWJlcn0gLyAke3Z9YFxuICAgICAgfVxuXG4gICAgICBpZiggIWlzRmluYWxJZHggKSBvdXQgKz0gJyAvICcgXG4gICAgfSlcblxuICAgIG91dCArPSAnXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsIG91dCBdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoLi4uYXJncykgPT4ge1xuICBjb25zdCBkaXYgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIFxuICBPYmplY3QuYXNzaWduKCBkaXYsIHtcbiAgICBpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6IGFyZ3MsXG4gIH0pXG5cbiAgZGl2Lm5hbWUgPSBkaXYuYmFzZW5hbWUgKyBkaXYuaWRcbiAgXG4gIHJldHVybiBkaXZcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbicgKSxcbiAgICB3aW5kb3dzID0gcmVxdWlyZSggJy4vd2luZG93cycgKSxcbiAgICBkYXRhICAgID0gcmVxdWlyZSggJy4vZGF0YScgKSxcbiAgICBwZWVrICAgID0gcmVxdWlyZSggJy4vcGVlaycgKSxcbiAgICBwaGFzb3IgID0gcmVxdWlyZSggJy4vcGhhc29yJyApLFxuICAgIGRlZmF1bHRzID0ge1xuICAgICAgdHlwZTondHJpYW5ndWxhcicsIGxlbmd0aDoxMDI0LCBhbHBoYTouMTUsIHNoaWZ0OjAsIHJldmVyc2U6ZmFsc2UgXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb3BzID0+IHtcbiAgXG4gIGxldCBwcm9wZXJ0aWVzID0gT2JqZWN0LmFzc2lnbigge30sIGRlZmF1bHRzLCBwcm9wcyApXG4gIGxldCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCBwcm9wZXJ0aWVzLmxlbmd0aCApXG5cbiAgbGV0IG5hbWUgPSBwcm9wZXJ0aWVzLnR5cGUgKyAnXycgKyBwcm9wZXJ0aWVzLmxlbmd0aCArICdfJyArIHByb3BlcnRpZXMuc2hpZnQgKyAnXycgKyBwcm9wZXJ0aWVzLnJldmVyc2UgKyAnXycgKyBwcm9wZXJ0aWVzLmFscGhhXG4gIGlmKCB0eXBlb2YgZ2VuLmdsb2JhbHMud2luZG93c1sgbmFtZSBdID09PSAndW5kZWZpbmVkJyApIHsgXG5cbiAgICBmb3IoIGxldCBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICBidWZmZXJbIGkgXSA9IHdpbmRvd3NbIHByb3BlcnRpZXMudHlwZSBdKCBwcm9wZXJ0aWVzLmxlbmd0aCwgaSwgcHJvcGVydGllcy5hbHBoYSwgcHJvcGVydGllcy5zaGlmdCApXG4gICAgfVxuXG4gICAgaWYoIHByb3BlcnRpZXMucmV2ZXJzZSA9PT0gdHJ1ZSApIHsgXG4gICAgICBidWZmZXIucmV2ZXJzZSgpXG4gICAgfVxuICAgIGdlbi5nbG9iYWxzLndpbmRvd3NbIG5hbWUgXSA9IGRhdGEoIGJ1ZmZlciApXG4gIH1cblxuICBsZXQgdWdlbiA9IGdlbi5nbG9iYWxzLndpbmRvd3NbIG5hbWUgXSBcbiAgdWdlbi5uYW1lID0gJ2VudicgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZXEnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLCBvdXRcblxuICAgIG91dCA9IHRoaXMuaW5wdXRzWzBdID09PSB0aGlzLmlucHV0c1sxXSA/IDEgOiBgICB2YXIgJHt0aGlzLm5hbWV9ID0gKCR7aW5wdXRzWzBdfSA9PT0gJHtpbnB1dHNbMV19KSB8IDBcXG5cXG5gXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBgJHt0aGlzLm5hbWV9YFxuXG4gICAgcmV0dXJuIFsgYCR7dGhpcy5uYW1lfWAsIG91dCBdXG4gIH0sXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgaW4yICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGluMSwgaW4yIF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonZXhwJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IE1hdGguZXhwIH0pXG5cbiAgICAgIG91dCA9IGBnZW4uZXhwKCAke2lucHV0c1swXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmV4cCggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IGV4cCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBleHAuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gZXhwXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonZmxvb3InLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICAvL2dlbi5jbG9zdXJlcy5hZGQoeyBbIHRoaXMubmFtZSBdOiBNYXRoLmZsb29yIH0pXG5cbiAgICAgIG91dCA9IGAoICR7aW5wdXRzWzBdfSB8IDAgKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBpbnB1dHNbMF0gfCAwXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgZmxvb3IgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgZmxvb3IuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gZmxvb3Jcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonZm9sZCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb2RlLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIG91dFxuXG4gICAgb3V0ID0gdGhpcy5jcmVhdGVDYWxsYmFjayggaW5wdXRzWzBdLCB0aGlzLm1pbiwgdGhpcy5tYXggKSBcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZSArICdfdmFsdWUnXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUgKyAnX3ZhbHVlJywgb3V0IF1cbiAgfSxcblxuICBjcmVhdGVDYWxsYmFjayggdiwgbG8sIGhpICkge1xuICAgIGxldCBvdXQgPVxuYCB2YXIgJHt0aGlzLm5hbWV9X3ZhbHVlID0gJHt2fSxcbiAgICAgICR7dGhpcy5uYW1lfV9yYW5nZSA9ICR7aGl9IC0gJHtsb30sXG4gICAgICAke3RoaXMubmFtZX1fbnVtV3JhcHMgPSAwXG5cbiAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlID49ICR7aGl9KXtcbiAgICAke3RoaXMubmFtZX1fdmFsdWUgLT0gJHt0aGlzLm5hbWV9X3JhbmdlXG4gICAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlID49ICR7aGl9KXtcbiAgICAgICR7dGhpcy5uYW1lfV9udW1XcmFwcyA9ICgoJHt0aGlzLm5hbWV9X3ZhbHVlIC0gJHtsb30pIC8gJHt0aGlzLm5hbWV9X3JhbmdlKSB8IDBcbiAgICAgICR7dGhpcy5uYW1lfV92YWx1ZSAtPSAke3RoaXMubmFtZX1fcmFuZ2UgKiAke3RoaXMubmFtZX1fbnVtV3JhcHNcbiAgICB9XG4gICAgJHt0aGlzLm5hbWV9X251bVdyYXBzKytcbiAgfSBlbHNlIGlmKCR7dGhpcy5uYW1lfV92YWx1ZSA8ICR7bG99KXtcbiAgICAke3RoaXMubmFtZX1fdmFsdWUgKz0gJHt0aGlzLm5hbWV9X3JhbmdlXG4gICAgaWYoJHt0aGlzLm5hbWV9X3ZhbHVlIDwgJHtsb30pe1xuICAgICAgJHt0aGlzLm5hbWV9X251bVdyYXBzID0gKCgke3RoaXMubmFtZX1fdmFsdWUgLSAke2xvfSkgLyAke3RoaXMubmFtZX1fcmFuZ2UtIDEpIHwgMFxuICAgICAgJHt0aGlzLm5hbWV9X3ZhbHVlIC09ICR7dGhpcy5uYW1lfV9yYW5nZSAqICR7dGhpcy5uYW1lfV9udW1XcmFwc1xuICAgIH1cbiAgICAke3RoaXMubmFtZX1fbnVtV3JhcHMtLVxuICB9XG4gIGlmKCR7dGhpcy5uYW1lfV9udW1XcmFwcyAmIDEpICR7dGhpcy5uYW1lfV92YWx1ZSA9ICR7aGl9ICsgJHtsb30gLSAke3RoaXMubmFtZX1fdmFsdWVcbmBcbiAgICByZXR1cm4gJyAnICsgb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgbWluPTAsIG1heD0xICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIG1pbiwgXG4gICAgbWF4LFxuICAgIHVpZDogICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogWyBpbjEgXSxcbiAgfSlcbiAgXG4gIHVnZW4ubmFtZSA9IGAke3VnZW4uYmFzZW5hbWV9JHt1Z2VuLnVpZH1gXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2dhdGUnLFxuICBjb250cm9sU3RyaW5nOm51bGwsIC8vIGluc2VydCBpbnRvIG91dHB1dCBjb2RlZ2VuIGZvciBkZXRlcm1pbmluZyBpbmRleGluZ1xuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG4gICAgXG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICBcbiAgICBsZXQgbGFzdElucHV0TWVtb3J5SWR4ID0gJ21lbW9yeVsgJyArIHRoaXMubWVtb3J5Lmxhc3RJbnB1dC5pZHggKyAnIF0nLFxuICAgICAgICBvdXRwdXRNZW1vcnlTdGFydElkeCA9IHRoaXMubWVtb3J5Lmxhc3RJbnB1dC5pZHggKyAxLFxuICAgICAgICBpbnB1dFNpZ25hbCA9IGlucHV0c1swXSxcbiAgICAgICAgY29udHJvbFNpZ25hbCA9IGlucHV0c1sxXVxuICAgIFxuICAgIC8qIFxuICAgICAqIHdlIGNoZWNrIHRvIHNlZSBpZiB0aGUgY3VycmVudCBjb250cm9sIGlucHV0cyBlcXVhbHMgb3VyIGxhc3QgaW5wdXRcbiAgICAgKiBpZiBzbywgd2Ugc3RvcmUgdGhlIHNpZ25hbCBpbnB1dCBpbiB0aGUgbWVtb3J5IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudGx5XG4gICAgICogc2VsZWN0ZWQgaW5kZXguIElmIG5vdCwgd2UgcHV0IDAgaW4gdGhlIG1lbW9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGxhc3Qgc2VsZWN0ZWQgaW5kZXgsXG4gICAgICogY2hhbmdlIHRoZSBzZWxlY3RlZCBpbmRleCwgYW5kIHRoZW4gc3RvcmUgdGhlIHNpZ25hbCBpbiBwdXQgaW4gdGhlIG1lbWVyeSBhc3NvaWNhdGVkXG4gICAgICogd2l0aCB0aGUgbmV3bHkgc2VsZWN0ZWQgaW5kZXhcbiAgICAgKi9cbiAgICBcbiAgICBvdXQgPVxuXG5gIGlmKCAke2NvbnRyb2xTaWduYWx9ICE9PSAke2xhc3RJbnB1dE1lbW9yeUlkeH0gKSB7XG4gICAgbWVtb3J5WyAke2xhc3RJbnB1dE1lbW9yeUlkeH0gKyAke291dHB1dE1lbW9yeVN0YXJ0SWR4fSAgXSA9IDAgXG4gICAgJHtsYXN0SW5wdXRNZW1vcnlJZHh9ID0gJHtjb250cm9sU2lnbmFsfVxuICB9XG4gIG1lbW9yeVsgJHtvdXRwdXRNZW1vcnlTdGFydElkeH0gKyAke2NvbnRyb2xTaWduYWx9IF0gPSAke2lucHV0U2lnbmFsfVxuXG5gXG4gICAgdGhpcy5jb250cm9sU3RyaW5nID0gaW5wdXRzWzFdXG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWVcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgdGhpcy5vdXRwdXRzLmZvckVhY2goIHYgPT4gdi5nZW4oKSApXG5cbiAgICByZXR1cm4gWyBudWxsLCAnICcgKyBvdXQgXVxuICB9LFxuXG4gIGNoaWxkZ2VuKCkge1xuICAgIGlmKCB0aGlzLnBhcmVudC5pbml0aWFsaXplZCA9PT0gZmFsc2UgKSB7XG4gICAgICBnZW4uZ2V0SW5wdXRzKCB0aGlzICkgLy8gcGFyZW50IGdhdGUgaXMgb25seSBpbnB1dCBvZiBhIGdhdGUgb3V0cHV0LCBzaG91bGQgb25seSBiZSBnZW4nZCBvbmNlLlxuICAgIH1cblxuICAgIGlmKCBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSApXG5cbiAgICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGBtZW1vcnlbICR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fSBdYFxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gIGBtZW1vcnlbICR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fSBdYFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCBjb250cm9sLCBpbjEsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGRlZmF1bHRzID0geyBjb3VudDogMiB9XG5cbiAgaWYoIHR5cGVvZiBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgKSBPYmplY3QuYXNzaWduKCBkZWZhdWx0cywgcHJvcGVydGllcyApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIG91dHB1dHM6IFtdLFxuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGluMSwgY29udHJvbCBdLFxuICAgIG1lbW9yeToge1xuICAgICAgbGFzdElucHV0OiB7IGxlbmd0aDoxLCBpZHg6bnVsbCB9XG4gICAgfSxcbiAgICBpbml0aWFsaXplZDpmYWxzZVxuICB9LFxuICBkZWZhdWx0cyApXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7Z2VuLmdldFVJRCgpfWBcblxuICBmb3IoIGxldCBpID0gMDsgaSA8IHVnZW4uY291bnQ7IGkrKyApIHtcbiAgICB1Z2VuLm91dHB1dHMucHVzaCh7XG4gICAgICBpbmRleDppLFxuICAgICAgZ2VuOiBwcm90by5jaGlsZGdlbixcbiAgICAgIHBhcmVudDp1Z2VuLFxuICAgICAgaW5wdXRzOiBbIHVnZW4gXSxcbiAgICAgIG1lbW9yeToge1xuICAgICAgICB2YWx1ZTogeyBsZW5ndGg6MSwgaWR4Om51bGwgfVxuICAgICAgfSxcbiAgICAgIGluaXRpYWxpemVkOmZhbHNlLFxuICAgICAgbmFtZTogYCR7dWdlbi5uYW1lfV9vdXQke2dlbi5nZXRVSUQoKX1gXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxuLyogZ2VuLmpzXG4gKlxuICogbG93LWxldmVsIGNvZGUgZ2VuZXJhdGlvbiBmb3IgdW5pdCBnZW5lcmF0b3JzXG4gKlxuICovXG5cbmxldCBNZW1vcnlIZWxwZXIgPSByZXF1aXJlKCAnbWVtb3J5LWhlbHBlcicgKVxuXG5sZXQgZ2VuID0ge1xuXG4gIGFjY3VtOjAsXG4gIGdldFVJRCgpIHsgcmV0dXJuIHRoaXMuYWNjdW0rKyB9LFxuICBkZWJ1ZzpmYWxzZSxcbiAgc2FtcGxlcmF0ZTogNDQxMDAsIC8vIGNoYW5nZSBvbiBhdWRpb2NvbnRleHQgY3JlYXRpb25cbiAgc2hvdWxkTG9jYWxpemU6IGZhbHNlLFxuICBnbG9iYWxzOntcbiAgICB3aW5kb3dzOiB7fSxcbiAgfSxcbiAgXG4gIC8qIGNsb3N1cmVzXG4gICAqXG4gICAqIEZ1bmN0aW9ucyB0aGF0IGFyZSBpbmNsdWRlZCBhcyBhcmd1bWVudHMgdG8gbWFzdGVyIGNhbGxiYWNrLiBFeGFtcGxlczogTWF0aC5hYnMsIE1hdGgucmFuZG9tIGV0Yy5cbiAgICogWFhYIFNob3VsZCBwcm9iYWJseSBiZSByZW5hbWVkIGNhbGxiYWNrUHJvcGVydGllcyBvciBzb21ldGhpbmcgc2ltaWxhci4uLiBjbG9zdXJlcyBhcmUgbm8gbG9uZ2VyIHVzZWQuXG4gICAqL1xuXG4gIGNsb3N1cmVzOiBuZXcgU2V0KCksXG4gIHBhcmFtczogICBuZXcgU2V0KCksXG5cbiAgcGFyYW1ldGVyczpbXSxcbiAgZW5kQmxvY2s6IG5ldyBTZXQoKSxcbiAgaGlzdG9yaWVzOiBuZXcgTWFwKCksXG5cbiAgbWVtbzoge30sXG5cbiAgLy9kYXRhOiB7fSxcbiAgXG4gIC8qIGV4cG9ydFxuICAgKlxuICAgKiBwbGFjZSBnZW4gZnVuY3Rpb25zIGludG8gYW5vdGhlciBvYmplY3QgZm9yIGVhc2llciByZWZlcmVuY2VcbiAgICovXG5cbiAgZXhwb3J0KCBvYmogKSB7fSxcblxuICBhZGRUb0VuZEJsb2NrKCB2ICkge1xuICAgIHRoaXMuZW5kQmxvY2suYWRkKCAnICAnICsgdiApXG4gIH0sXG4gIFxuICByZXF1ZXN0TWVtb3J5KCBtZW1vcnlTcGVjLCBpbW11dGFibGU9ZmFsc2UgKSB7XG4gICAgZm9yKCBsZXQga2V5IGluIG1lbW9yeVNwZWMgKSB7XG4gICAgICBsZXQgcmVxdWVzdCA9IG1lbW9yeVNwZWNbIGtleSBdXG5cbiAgICAgIC8vY29uc29sZS5sb2coICdyZXF1ZXN0aW5nICcgKyBrZXkgKyAnOicgLCBKU09OLnN0cmluZ2lmeSggcmVxdWVzdCApIClcblxuICAgICAgaWYoIHJlcXVlc3QubGVuZ3RoID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCAndW5kZWZpbmVkIGxlbmd0aCBmb3I6Jywga2V5IClcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmlkeCA9IGdlbi5tZW1vcnkuYWxsb2MoIHJlcXVlc3QubGVuZ3RoLCBpbW11dGFibGUgKVxuICAgIH1cbiAgfSxcblxuICBjcmVhdGVNZW1vcnkoIGFtb3VudCwgdHlwZSApIHtcbiAgICBjb25zdCBtZW0gPSBNZW1vcnlIZWxwZXIuY3JlYXRlKCBhbW91bnQsIHR5cGUgKVxuICAgIHJldHVybiBtZW1cbiAgfSxcblxuICAvKiBjcmVhdGVDYWxsYmFja1xuICAgKlxuICAgKiBwYXJhbSB1Z2VuIC0gSGVhZCBvZiBncmFwaCB0byBiZSBjb2RlZ2VuJ2RcbiAgICpcbiAgICogR2VuZXJhdGUgY2FsbGJhY2sgZnVuY3Rpb24gZm9yIGEgcGFydGljdWxhciB1Z2VuIGdyYXBoLlxuICAgKiBUaGUgZ2VuLmNsb3N1cmVzIHByb3BlcnR5IHN0b3JlcyBmdW5jdGlvbnMgdGhhdCBuZWVkIHRvIGJlXG4gICAqIHBhc3NlZCBhcyBhcmd1bWVudHMgdG8gdGhlIGZpbmFsIGZ1bmN0aW9uOyB0aGVzZSBhcmUgcHJlZml4ZWRcbiAgICogYmVmb3JlIGFueSBkZWZpbmVkIHBhcmFtcyB0aGUgZ3JhcGggZXhwb3Nlcy4gRm9yIGV4YW1wbGUsIGdpdmVuOlxuICAgKlxuICAgKiBnZW4uY3JlYXRlQ2FsbGJhY2soIGFicyggcGFyYW0oKSApIClcbiAgICpcbiAgICogLi4uIHRoZSBnZW5lcmF0ZWQgZnVuY3Rpb24gd2lsbCBoYXZlIGEgc2lnbmF0dXJlIG9mICggYWJzLCBwMCApLlxuICAgKi9cbiAgXG4gIGNyZWF0ZUNhbGxiYWNrKCB1Z2VuLCBtZW0sIGRlYnVnID0gZmFsc2UsIHNob3VsZElubGluZU1lbW9yeT1mYWxzZSwgbWVtVHlwZSA9IEZsb2F0NjRBcnJheSApIHtcbiAgICBsZXQgaXNTdGVyZW8gPSBBcnJheS5pc0FycmF5KCB1Z2VuICkgJiYgdWdlbi5sZW5ndGggPiAxLFxuICAgICAgICBjYWxsYmFjaywgXG4gICAgICAgIGNoYW5uZWwxLCBjaGFubmVsMlxuXG4gICAgaWYoIHR5cGVvZiBtZW0gPT09ICdudW1iZXInIHx8IG1lbSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgbWVtID0gTWVtb3J5SGVscGVyLmNyZWF0ZSggbWVtLCBtZW1UeXBlIClcbiAgICB9XG4gICAgXG4gICAgLy9jb25zb2xlLmxvZyggJ2NiIG1lbW9yeTonLCBtZW0gKVxuICAgIHRoaXMubWVtb3J5ID0gbWVtXG4gICAgdGhpcy5tZW1vID0ge30gXG4gICAgdGhpcy5lbmRCbG9jay5jbGVhcigpXG4gICAgdGhpcy5jbG9zdXJlcy5jbGVhcigpXG4gICAgdGhpcy5wYXJhbXMuY2xlYXIoKVxuICAgIC8vdGhpcy5nbG9iYWxzID0geyB3aW5kb3dzOnt9IH1cbiAgICBcbiAgICB0aGlzLnBhcmFtZXRlcnMubGVuZ3RoID0gMFxuICAgIFxuICAgIHRoaXMuZnVuY3Rpb25Cb2R5ID0gXCIgICd1c2Ugc3RyaWN0J1xcblwiXG4gICAgaWYoIHNob3VsZElubGluZU1lbW9yeT09PWZhbHNlICkgdGhpcy5mdW5jdGlvbkJvZHkgKz0gXCIgIHZhciBtZW1vcnkgPSBnZW4ubWVtb3J5XFxuXFxuXCIgXG5cbiAgICAvLyBjYWxsIC5nZW4oKSBvbiB0aGUgaGVhZCBvZiB0aGUgZ3JhcGggd2UgYXJlIGdlbmVyYXRpbmcgdGhlIGNhbGxiYWNrIGZvclxuICAgIC8vY29uc29sZS5sb2coICdIRUFEJywgdWdlbiApXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCAxICsgaXNTdGVyZW87IGkrKyApIHtcbiAgICAgIGlmKCB0eXBlb2YgdWdlbltpXSA9PT0gJ251bWJlcicgKSBjb250aW51ZVxuXG4gICAgICAvL2xldCBjaGFubmVsID0gaXNTdGVyZW8gPyB1Z2VuW2ldLmdlbigpIDogdWdlbi5nZW4oKSxcbiAgICAgIGxldCBjaGFubmVsID0gaXNTdGVyZW8gPyB0aGlzLmdldElucHV0KCB1Z2VuW2ldICkgOiB0aGlzLmdldElucHV0KCB1Z2VuICksIFxuICAgICAgICAgIGJvZHkgPSAnJ1xuXG4gICAgICAvLyBpZiAuZ2VuKCkgcmV0dXJucyBhcnJheSwgYWRkIHVnZW4gY2FsbGJhY2sgKGdyYXBoT3V0cHV0WzFdKSB0byBvdXIgb3V0cHV0IGZ1bmN0aW9ucyBib2R5XG4gICAgICAvLyBhbmQgdGhlbiByZXR1cm4gbmFtZSBvZiB1Z2VuLiBJZiAuZ2VuKCkgb25seSBnZW5lcmF0ZXMgYSBudW1iZXIgKGZvciByZWFsbHkgc2ltcGxlIGdyYXBocylcbiAgICAgIC8vIGp1c3QgcmV0dXJuIHRoYXQgbnVtYmVyIChncmFwaE91dHB1dFswXSkuXG4gICAgICBib2R5ICs9IEFycmF5LmlzQXJyYXkoIGNoYW5uZWwgKSA/IGNoYW5uZWxbMV0gKyAnXFxuJyArIGNoYW5uZWxbMF0gOiBjaGFubmVsXG5cbiAgICAgIC8vIHNwbGl0IGJvZHkgdG8gaW5qZWN0IHJldHVybiBrZXl3b3JkIG9uIGxhc3QgbGluZVxuICAgICAgYm9keSA9IGJvZHkuc3BsaXQoJ1xcbicpXG4gICAgIFxuICAgICAgLy9pZiggZGVidWcgKSBjb25zb2xlLmxvZyggJ2Z1bmN0aW9uQm9keSBsZW5ndGgnLCBib2R5IClcbiAgICAgIFxuICAgICAgLy8gbmV4dCBsaW5lIGlzIHRvIGFjY29tbW9kYXRlIG1lbW8gYXMgZ3JhcGggaGVhZFxuICAgICAgaWYoIGJvZHlbIGJvZHkubGVuZ3RoIC0xIF0udHJpbSgpLmluZGV4T2YoJ2xldCcpID4gLTEgKSB7IGJvZHkucHVzaCggJ1xcbicgKSB9IFxuXG4gICAgICAvLyBnZXQgaW5kZXggb2YgbGFzdCBsaW5lXG4gICAgICBsZXQgbGFzdGlkeCA9IGJvZHkubGVuZ3RoIC0gMVxuXG4gICAgICAvLyBpbnNlcnQgcmV0dXJuIGtleXdvcmRcbiAgICAgIGJvZHlbIGxhc3RpZHggXSA9ICcgIGdlbi5vdXRbJyArIGkgKyAnXSAgPSAnICsgYm9keVsgbGFzdGlkeCBdICsgJ1xcbidcblxuICAgICAgdGhpcy5mdW5jdGlvbkJvZHkgKz0gYm9keS5qb2luKCdcXG4nKVxuICAgIH1cbiAgICBcbiAgICB0aGlzLmhpc3Rvcmllcy5mb3JFYWNoKCB2YWx1ZSA9PiB7XG4gICAgICBpZiggdmFsdWUgIT09IG51bGwgKVxuICAgICAgICB2YWx1ZS5nZW4oKSAgICAgIFxuICAgIH0pXG5cbiAgICBsZXQgcmV0dXJuU3RhdGVtZW50ID0gaXNTdGVyZW8gPyAnICByZXR1cm4gZ2VuLm91dCcgOiAnICByZXR1cm4gZ2VuLm91dFswXSdcbiAgICBcbiAgICB0aGlzLmZ1bmN0aW9uQm9keSA9IHRoaXMuZnVuY3Rpb25Cb2R5LnNwbGl0KCdcXG4nKVxuXG4gICAgaWYoIHRoaXMuZW5kQmxvY2suc2l6ZSApIHsgXG4gICAgICB0aGlzLmZ1bmN0aW9uQm9keSA9IHRoaXMuZnVuY3Rpb25Cb2R5LmNvbmNhdCggQXJyYXkuZnJvbSggdGhpcy5lbmRCbG9jayApIClcbiAgICAgIHRoaXMuZnVuY3Rpb25Cb2R5LnB1c2goIHJldHVyblN0YXRlbWVudCApXG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmZ1bmN0aW9uQm9keS5wdXNoKCByZXR1cm5TdGF0ZW1lbnQgKVxuICAgIH1cbiAgICAvLyByZWFzc2VtYmxlIGZ1bmN0aW9uIGJvZHlcbiAgICB0aGlzLmZ1bmN0aW9uQm9keSA9IHRoaXMuZnVuY3Rpb25Cb2R5LmpvaW4oJ1xcbicpXG5cbiAgICAvLyB3ZSBjYW4gb25seSBkeW5hbWljYWxseSBjcmVhdGUgYSBuYW1lZCBmdW5jdGlvbiBieSBkeW5hbWljYWxseSBjcmVhdGluZyBhbm90aGVyIGZ1bmN0aW9uXG4gICAgLy8gdG8gY29uc3RydWN0IHRoZSBuYW1lZCBmdW5jdGlvbiEgc2hlZXNoLi4uXG4gICAgLy9cbiAgICBpZiggc2hvdWxkSW5saW5lTWVtb3J5ID09PSB0cnVlICkge1xuICAgICAgdGhpcy5wYXJhbWV0ZXJzLnB1c2goICdtZW1vcnknIClcbiAgICB9XG4gICAgbGV0IGJ1aWxkU3RyaW5nID0gYHJldHVybiBmdW5jdGlvbiBnZW4oICR7IHRoaXMucGFyYW1ldGVycy5qb2luKCcsJykgfSApeyBcXG4keyB0aGlzLmZ1bmN0aW9uQm9keSB9XFxufWBcbiAgICBcbiAgICBpZiggdGhpcy5kZWJ1ZyB8fCBkZWJ1ZyApIGNvbnNvbGUubG9nKCBidWlsZFN0cmluZyApIFxuXG4gICAgY2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24oIGJ1aWxkU3RyaW5nICkoKVxuXG4gICAgXG4gICAgLy8gYXNzaWduIHByb3BlcnRpZXMgdG8gbmFtZWQgZnVuY3Rpb25cbiAgICBmb3IoIGxldCBkaWN0IG9mIHRoaXMuY2xvc3VyZXMudmFsdWVzKCkgKSB7XG4gICAgICBsZXQgbmFtZSA9IE9iamVjdC5rZXlzKCBkaWN0IClbMF0sXG4gICAgICAgICAgdmFsdWUgPSBkaWN0WyBuYW1lIF1cblxuICAgICAgY2FsbGJhY2tbIG5hbWUgXSA9IHZhbHVlXG4gICAgfVxuXG4gICAgZm9yKCBsZXQgZGljdCBvZiB0aGlzLnBhcmFtcy52YWx1ZXMoKSApIHtcbiAgICAgIGxldCBuYW1lID0gT2JqZWN0LmtleXMoIGRpY3QgKVswXSxcbiAgICAgICAgICB1Z2VuID0gZGljdFsgbmFtZSBdXG4gICAgICBcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggY2FsbGJhY2ssIG5hbWUsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQoKSB7IHJldHVybiB1Z2VuLnZhbHVlIH0sXG4gICAgICAgIHNldCh2KXsgdWdlbi52YWx1ZSA9IHYgfVxuICAgICAgfSlcbiAgICAgIC8vY2FsbGJhY2tbIG5hbWUgXSA9IHZhbHVlXG4gICAgfVxuXG4gICAgY2FsbGJhY2suZGF0YSA9IHRoaXMuZGF0YVxuICAgIGNhbGxiYWNrLm91dCAgPSBuZXcgRmxvYXQ2NEFycmF5KCAyIClcbiAgICBjYWxsYmFjay5wYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJzLnNsaWNlKCAwIClcblxuICAgIC8vaWYoIE1lbW9yeUhlbHBlci5pc1Byb3RvdHlwZU9mKCB0aGlzLm1lbW9yeSApICkgXG4gICAgY2FsbGJhY2subWVtb3J5ID0gdGhpcy5tZW1vcnkuaGVhcFxuXG4gICAgdGhpcy5oaXN0b3JpZXMuY2xlYXIoKVxuXG4gICAgcmV0dXJuIGNhbGxiYWNrXG4gIH0sXG4gIFxuICAvKiBnZXRJbnB1dHNcbiAgICpcbiAgICogQ2FsbGVkIGJ5IGVhY2ggaW5kaXZpZHVhbCB1Z2VuIHdoZW4gdGhlaXIgLmdlbigpIG1ldGhvZCBpcyBjYWxsZWQgdG8gcmVzb2x2ZSB0aGVpciB2YXJpb3VzIGlucHV0cy5cbiAgICogSWYgYW4gaW5wdXQgaXMgYSBudW1iZXIsIHJldHVybiB0aGUgbnVtYmVyLiBJZlxuICAgKiBpdCBpcyBhbiB1Z2VuLCBjYWxsIC5nZW4oKSBvbiB0aGUgdWdlbiwgbWVtb2l6ZSB0aGUgcmVzdWx0IGFuZCByZXR1cm4gdGhlIHJlc3VsdC4gSWYgdGhlXG4gICAqIHVnZW4gaGFzIHByZXZpb3VzbHkgYmVlbiBtZW1vaXplZCByZXR1cm4gdGhlIG1lbW9pemVkIHZhbHVlLlxuICAgKlxuICAgKi9cbiAgZ2V0SW5wdXRzKCB1Z2VuICkge1xuICAgIHJldHVybiB1Z2VuLmlucHV0cy5tYXAoIGdlbi5nZXRJbnB1dCApIFxuICB9LFxuXG4gIGdldElucHV0KCBpbnB1dCApIHtcbiAgICBsZXQgaXNPYmplY3QgPSB0eXBlb2YgaW5wdXQgPT09ICdvYmplY3QnLFxuICAgICAgICBwcm9jZXNzZWRJbnB1dFxuXG4gICAgaWYoIGlzT2JqZWN0ICkgeyAvLyBpZiBpbnB1dCBpcyBhIHVnZW4uLi4gXG4gICAgICAvL2NvbnNvbGUubG9nKCBpbnB1dC5uYW1lLCBnZW4ubWVtb1sgaW5wdXQubmFtZSBdIClcbiAgICAgIGlmKCBnZW4ubWVtb1sgaW5wdXQubmFtZSBdICkgeyAvLyBpZiBpdCBoYXMgYmVlbiBtZW1vaXplZC4uLlxuICAgICAgICBwcm9jZXNzZWRJbnB1dCA9IGdlbi5tZW1vWyBpbnB1dC5uYW1lIF1cbiAgICAgIH1lbHNlIGlmKCBBcnJheS5pc0FycmF5KCBpbnB1dCApICkge1xuICAgICAgICBnZW4uZ2V0SW5wdXQoIGlucHV0WzBdIClcbiAgICAgICAgZ2VuLmdldElucHV0KCBpbnB1dFsxXSApXG4gICAgICB9ZWxzZXsgLy8gaWYgbm90IG1lbW9pemVkIGdlbmVyYXRlIGNvZGUgIFxuICAgICAgICBpZiggdHlwZW9mIGlucHV0LmdlbiAhPT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyggJ25vIGdlbiBmb3VuZDonLCBpbnB1dCwgaW5wdXQuZ2VuIClcbiAgICAgICAgfVxuICAgICAgICBsZXQgY29kZSA9IGlucHV0LmdlbigpXG4gICAgICAgIC8vaWYoIGNvZGUuaW5kZXhPZiggJ09iamVjdCcgKSA+IC0xICkgY29uc29sZS5sb2coICdiYWQgaW5wdXQ6JywgaW5wdXQsIGNvZGUgKVxuICAgICAgICBcbiAgICAgICAgaWYoIEFycmF5LmlzQXJyYXkoIGNvZGUgKSApIHtcbiAgICAgICAgICBpZiggIWdlbi5zaG91bGRMb2NhbGl6ZSApIHtcbiAgICAgICAgICAgIGdlbi5mdW5jdGlvbkJvZHkgKz0gY29kZVsxXVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZ2VuLmNvZGVOYW1lID0gY29kZVswXVxuICAgICAgICAgICAgZ2VuLmxvY2FsaXplZENvZGUucHVzaCggY29kZVsxXSApXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vY29uc29sZS5sb2coICdhZnRlciBHRU4nICwgdGhpcy5mdW5jdGlvbkJvZHkgKVxuICAgICAgICAgIHByb2Nlc3NlZElucHV0ID0gY29kZVswXVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBwcm9jZXNzZWRJbnB1dCA9IGNvZGVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1lbHNleyAvLyBpdCBpbnB1dCBpcyBhIG51bWJlclxuICAgICAgcHJvY2Vzc2VkSW5wdXQgPSBpbnB1dFxuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzZWRJbnB1dFxuICB9LFxuXG4gIHN0YXJ0TG9jYWxpemUoKSB7XG4gICAgdGhpcy5sb2NhbGl6ZWRDb2RlID0gW11cbiAgICB0aGlzLnNob3VsZExvY2FsaXplID0gdHJ1ZVxuICB9LFxuICBlbmRMb2NhbGl6ZSgpIHtcbiAgICB0aGlzLnNob3VsZExvY2FsaXplID0gZmFsc2VcblxuICAgIHJldHVybiBbIHRoaXMuY29kZU5hbWUsIHRoaXMubG9jYWxpemVkQ29kZS5zbGljZSgwKSBdXG4gIH0sXG5cbiAgZnJlZSggZ3JhcGggKSB7XG4gICAgaWYoIEFycmF5LmlzQXJyYXkoIGdyYXBoICkgKSB7IC8vIHN0ZXJlbyB1Z2VuXG4gICAgICBmb3IoIGxldCBjaGFubmVsIG9mIGdyYXBoICkge1xuICAgICAgICB0aGlzLmZyZWUoIGNoYW5uZWwgKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiggdHlwZW9mIGdyYXBoID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgaWYoIGdyYXBoLm1lbW9yeSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgIGZvciggbGV0IG1lbW9yeUtleSBpbiBncmFwaC5tZW1vcnkgKSB7XG4gICAgICAgICAgICB0aGlzLm1lbW9yeS5mcmVlKCBncmFwaC5tZW1vcnlbIG1lbW9yeUtleSBdLmlkeCApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmKCBBcnJheS5pc0FycmF5KCBncmFwaC5pbnB1dHMgKSApIHtcbiAgICAgICAgICBmb3IoIGxldCB1Z2VuIG9mIGdyYXBoLmlucHV0cyApIHtcbiAgICAgICAgICAgIHRoaXMuZnJlZSggdWdlbiApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VuXG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2d0JyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9IGAgIFxuXG4gICAgaWYoIGlzTmFOKCB0aGlzLmlucHV0c1swXSApIHx8IGlzTmFOKCB0aGlzLmlucHV0c1sxXSApICkge1xuICAgICAgb3V0ICs9IGAoKCAke2lucHV0c1swXX0gPiAke2lucHV0c1sxXX0pIHwgMCApYFxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gaW5wdXRzWzBdID4gaW5wdXRzWzFdID8gMSA6IDAgXG4gICAgfVxuICAgIG91dCArPSAnXFxuXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gW3RoaXMubmFtZSwgb3V0XVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgZ3QgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgZ3QuaW5wdXRzID0gWyB4LHkgXVxuICBndC5uYW1lID0gZ3QuYmFzZW5hbWUgKyBnZW4uZ2V0VUlEKClcblxuICByZXR1cm4gZ3Rcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J2d0ZScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSBgICBcblxuICAgIGlmKCBpc05hTiggdGhpcy5pbnB1dHNbMF0gKSB8fCBpc05hTiggdGhpcy5pbnB1dHNbMV0gKSApIHtcbiAgICAgIG91dCArPSBgKCAke2lucHV0c1swXX0gPj0gJHtpbnB1dHNbMV19IHwgMCApYFxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gaW5wdXRzWzBdID49IGlucHV0c1sxXSA/IDEgOiAwIFxuICAgIH1cbiAgICBvdXQgKz0gJ1xcblxcbidcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIFt0aGlzLm5hbWUsIG91dF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh4LHkpID0+IHtcbiAgbGV0IGd0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGd0LmlucHV0cyA9IFsgeCx5IF1cbiAgZ3QubmFtZSA9ICdndGUnICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIGd0XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonZ3RwJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgfHwgaXNOYU4oIHRoaXMuaW5wdXRzWzFdICkgKSB7XG4gICAgICBvdXQgPSBgKCR7aW5wdXRzWyAwIF19ICogKCAoICR7aW5wdXRzWzBdfSA+ICR7aW5wdXRzWzFdfSApIHwgMCApIClgIFxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBpbnB1dHNbMF0gKiAoICggaW5wdXRzWzBdID4gaW5wdXRzWzFdICkgfCAwIClcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHgseSkgPT4ge1xuICBsZXQgZ3RwID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGd0cC5pbnB1dHMgPSBbIHgseSBdXG5cbiAgcmV0dXJuIGd0cFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW4xPTAgKSA9PiB7XG4gIGxldCB1Z2VuID0ge1xuICAgIGlucHV0czogWyBpbjEgXSxcbiAgICBtZW1vcnk6IHsgdmFsdWU6IHsgbGVuZ3RoOjEsIGlkeDogbnVsbCB9IH0sXG4gICAgcmVjb3JkZXI6IG51bGwsXG5cbiAgICBpbiggdiApIHtcbiAgICAgIGlmKCBnZW4uaGlzdG9yaWVzLmhhcyggdiApICl7XG4gICAgICAgIGxldCBtZW1vSGlzdG9yeSA9IGdlbi5oaXN0b3JpZXMuZ2V0KCB2IClcbiAgICAgICAgdWdlbi5uYW1lID0gbWVtb0hpc3RvcnkubmFtZVxuICAgICAgICByZXR1cm4gbWVtb0hpc3RvcnlcbiAgICAgIH1cblxuICAgICAgbGV0IG9iaiA9IHtcbiAgICAgICAgZ2VuKCkge1xuICAgICAgICAgIGxldCBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB1Z2VuIClcblxuICAgICAgICAgIGlmKCB1Z2VuLm1lbW9yeS52YWx1ZS5pZHggPT09IG51bGwgKSB7XG4gICAgICAgICAgICBnZW4ucmVxdWVzdE1lbW9yeSggdWdlbi5tZW1vcnkgKVxuICAgICAgICAgICAgZ2VuLm1lbW9yeS5oZWFwWyB1Z2VuLm1lbW9yeS52YWx1ZS5pZHggXSA9IGluMVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBpZHggPSB1Z2VuLm1lbW9yeS52YWx1ZS5pZHhcbiAgICAgICAgICBcbiAgICAgICAgICBnZW4uYWRkVG9FbmRCbG9jayggJ21lbW9yeVsgJyArIGlkeCArICcgXSA9ICcgKyBpbnB1dHNbIDAgXSApXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmV0dXJuIHVnZW4gdGhhdCBpcyBiZWluZyByZWNvcmRlZCBpbnN0ZWFkIG9mIHNzZC5cbiAgICAgICAgICAvLyB0aGlzIGVmZmVjdGl2ZWx5IG1ha2VzIGEgY2FsbCB0byBzc2QucmVjb3JkKCkgdHJhbnNwYXJlbnQgdG8gdGhlIGdyYXBoLlxuICAgICAgICAgIC8vIHJlY29yZGluZyBpcyB0cmlnZ2VyZWQgYnkgcHJpb3IgY2FsbCB0byBnZW4uYWRkVG9FbmRCbG9jay5cbiAgICAgICAgICBnZW4uaGlzdG9yaWVzLnNldCggdiwgb2JqIClcblxuICAgICAgICAgIHJldHVybiBpbnB1dHNbIDAgXVxuICAgICAgICB9LFxuICAgICAgICBuYW1lOiB1Z2VuLm5hbWUgKyAnX2luJytnZW4uZ2V0VUlEKCksXG4gICAgICAgIG1lbW9yeTogdWdlbi5tZW1vcnlcbiAgICAgIH1cblxuICAgICAgdGhpcy5pbnB1dHNbIDAgXSA9IHZcbiAgICAgIFxuICAgICAgdWdlbi5yZWNvcmRlciA9IG9ialxuXG4gICAgICByZXR1cm4gb2JqXG4gICAgfSxcbiAgICBcbiAgICBvdXQ6IHtcbiAgICAgICAgICAgIFxuICAgICAgZ2VuKCkge1xuICAgICAgICBpZiggdWdlbi5tZW1vcnkudmFsdWUuaWR4ID09PSBudWxsICkge1xuICAgICAgICAgIGlmKCBnZW4uaGlzdG9yaWVzLmdldCggdWdlbi5pbnB1dHNbMF0gKSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgZ2VuLmhpc3Rvcmllcy5zZXQoIHVnZW4uaW5wdXRzWzBdLCB1Z2VuLnJlY29yZGVyIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHVnZW4ubWVtb3J5IClcbiAgICAgICAgICBnZW4ubWVtb3J5LmhlYXBbIHVnZW4ubWVtb3J5LnZhbHVlLmlkeCBdID0gcGFyc2VGbG9hdCggaW4xIClcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWR4ID0gdWdlbi5tZW1vcnkudmFsdWUuaWR4XG4gICAgICAgICBcbiAgICAgICAgcmV0dXJuICdtZW1vcnlbICcgKyBpZHggKyAnIF0gJ1xuICAgICAgfSxcbiAgICB9LFxuXG4gICAgdWlkOiBnZW4uZ2V0VUlEKCksXG4gIH1cbiAgXG4gIHVnZW4ub3V0Lm1lbW9yeSA9IHVnZW4ubWVtb3J5IFxuXG4gIHVnZW4ubmFtZSA9ICdoaXN0b3J5JyArIHVnZW4udWlkXG4gIHVnZW4ub3V0Lm5hbWUgPSB1Z2VuLm5hbWUgKyAnX291dCdcbiAgdWdlbi5pbi5fbmFtZSAgPSB1Z2VuLm5hbWUgPSAnX2luJ1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdWdlbiwgJ3ZhbHVlJywge1xuICAgIGdldCgpIHtcbiAgICAgIGlmKCB0aGlzLm1lbW9yeS52YWx1ZS5pZHggIT09IG51bGwgKSB7XG4gICAgICAgIHJldHVybiBnZW4ubWVtb3J5LmhlYXBbIHRoaXMubWVtb3J5LnZhbHVlLmlkeCBdXG4gICAgICB9XG4gICAgfSxcbiAgICBzZXQoIHYgKSB7XG4gICAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ICE9PSBudWxsICkge1xuICAgICAgICBnZW4ubWVtb3J5LmhlYXBbIHRoaXMubWVtb3J5LnZhbHVlLmlkeCBdID0gdiBcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2lmZWxzZScsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb25kaXRpb25hbHMgPSB0aGlzLmlucHV0c1swXSxcbiAgICAgICAgZGVmYXVsdFZhbHVlID0gZ2VuLmdldElucHV0KCBjb25kaXRpb25hbHNbIGNvbmRpdGlvbmFscy5sZW5ndGggLSAxXSApLFxuICAgICAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9X291dCA9ICR7ZGVmYXVsdFZhbHVlfVxcbmAgXG5cbiAgICAvL2NvbnNvbGUubG9nKCAnY29uZGl0aW9uYWxzOicsIHRoaXMubmFtZSwgY29uZGl0aW9uYWxzIClcblxuICAgIC8vY29uc29sZS5sb2coICdkZWZhdWx0VmFsdWU6JywgZGVmYXVsdFZhbHVlIClcblxuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgY29uZGl0aW9uYWxzLmxlbmd0aCAtIDI7IGkrPSAyICkge1xuICAgICAgbGV0IGlzRW5kQmxvY2sgPSBpID09PSBjb25kaXRpb25hbHMubGVuZ3RoIC0gMyxcbiAgICAgICAgICBjb25kICA9IGdlbi5nZXRJbnB1dCggY29uZGl0aW9uYWxzWyBpIF0gKSxcbiAgICAgICAgICBwcmVibG9jayA9IGNvbmRpdGlvbmFsc1sgaSsxIF0sXG4gICAgICAgICAgYmxvY2ssIGJsb2NrTmFtZSwgb3V0cHV0XG5cbiAgICAgIC8vY29uc29sZS5sb2coICdwYicsIHByZWJsb2NrIClcblxuICAgICAgaWYoIHR5cGVvZiBwcmVibG9jayA9PT0gJ251bWJlcicgKXtcbiAgICAgICAgYmxvY2sgPSBwcmVibG9ja1xuICAgICAgICBibG9ja05hbWUgPSBudWxsXG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYoIGdlbi5tZW1vWyBwcmVibG9jay5uYW1lIF0gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAvLyB1c2VkIHRvIHBsYWNlIGFsbCBjb2RlIGRlcGVuZGVuY2llcyBpbiBhcHByb3ByaWF0ZSBibG9ja3NcbiAgICAgICAgICBnZW4uc3RhcnRMb2NhbGl6ZSgpXG5cbiAgICAgICAgICBnZW4uZ2V0SW5wdXQoIHByZWJsb2NrIClcblxuICAgICAgICAgIGJsb2NrID0gZ2VuLmVuZExvY2FsaXplKClcbiAgICAgICAgICBibG9ja05hbWUgPSBibG9ja1swXVxuICAgICAgICAgIGJsb2NrID0gYmxvY2tbIDEgXS5qb2luKCcnKVxuICAgICAgICAgIGJsb2NrID0gJyAgJyArIGJsb2NrLnJlcGxhY2UoIC9cXG4vZ2ksICdcXG4gICcgKVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBibG9jayA9ICcnXG4gICAgICAgICAgYmxvY2tOYW1lID0gZ2VuLm1lbW9bIHByZWJsb2NrLm5hbWUgXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG91dHB1dCA9IGJsb2NrTmFtZSA9PT0gbnVsbCA/IFxuICAgICAgICBgICAke3RoaXMubmFtZX1fb3V0ID0gJHtibG9ja31gIDpcbiAgICAgICAgYCR7YmxvY2t9ICAke3RoaXMubmFtZX1fb3V0ID0gJHtibG9ja05hbWV9YFxuICAgICAgXG4gICAgICBpZiggaT09PTAgKSBvdXQgKz0gJyAnXG4gICAgICBvdXQgKz0gXG5gIGlmKCAke2NvbmR9ID09PSAxICkge1xuJHtvdXRwdXR9XG4gIH1gXG5cbiAgICAgIGlmKCAhaXNFbmRCbG9jayApIHtcbiAgICAgICAgb3V0ICs9IGAgZWxzZWBcbiAgICAgIH1lbHNle1xuICAgICAgICBvdXQgKz0gYFxcbmBcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBgJHt0aGlzLm5hbWV9X291dGBcblxuICAgIHJldHVybiBbIGAke3RoaXMubmFtZX1fb3V0YCwgb3V0IF1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggLi4uYXJncyAgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGNvbmRpdGlvbnMgPSBBcnJheS5pc0FycmF5KCBhcmdzWzBdICkgPyBhcmdzWzBdIDogYXJnc1xuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHtcbiAgICB1aWQ6ICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiAgWyBjb25kaXRpb25zIF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonaW4nLFxuXG4gIGdlbigpIHtcbiAgICBnZW4ucGFyYW1ldGVycy5wdXNoKCB0aGlzLm5hbWUgKVxuICAgIFxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIHRoaXMubmFtZVxuICB9IFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggbmFtZSApID0+IHtcbiAgbGV0IGlucHV0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGlucHV0LmlkICAgPSBnZW4uZ2V0VUlEKClcbiAgaW5wdXQubmFtZSA9IG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBgJHtpbnB1dC5iYXNlbmFtZX0ke2lucHV0LmlkfWBcbiAgaW5wdXRbMF0gPSB7XG4gICAgZ2VuKCkge1xuICAgICAgaWYoICEgZ2VuLnBhcmFtZXRlcnMuaW5jbHVkZXMoIGlucHV0Lm5hbWUgKSApIGdlbi5wYXJhbWV0ZXJzLnB1c2goIGlucHV0Lm5hbWUgKVxuICAgICAgcmV0dXJuIGlucHV0Lm5hbWUgKyAnWzBdJ1xuICAgIH1cbiAgfVxuICBpbnB1dFsxXSA9IHtcbiAgICBnZW4oKSB7XG4gICAgICBpZiggISBnZW4ucGFyYW1ldGVycy5pbmNsdWRlcyggaW5wdXQubmFtZSApICkgZ2VuLnBhcmFtZXRlcnMucHVzaCggaW5wdXQubmFtZSApXG4gICAgICByZXR1cm4gaW5wdXQubmFtZSArICdbMV0nXG4gICAgfVxuICB9XG5cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgbGlicmFyeSA9IHtcbiAgZXhwb3J0KCBkZXN0aW5hdGlvbiApIHtcbiAgICBpZiggZGVzdGluYXRpb24gPT09IHdpbmRvdyApIHtcbiAgICAgIGRlc3RpbmF0aW9uLnNzZCA9IGxpYnJhcnkuaGlzdG9yeSAgICAvLyBoaXN0b3J5IGlzIHdpbmRvdyBvYmplY3QgcHJvcGVydHksIHNvIHVzZSBzc2QgYXMgYWxpYXNcbiAgICAgIGRlc3RpbmF0aW9uLmlucHV0ID0gbGlicmFyeS5pbiAgICAgICAvLyBpbiBpcyBhIGtleXdvcmQgaW4gamF2YXNjcmlwdFxuICAgICAgZGVzdGluYXRpb24udGVybmFyeSA9IGxpYnJhcnkuc3dpdGNoIC8vIHN3aXRjaCBpcyBhIGtleXdvcmQgaW4gamF2YXNjcmlwdFxuXG4gICAgICBkZWxldGUgbGlicmFyeS5oaXN0b3J5XG4gICAgICBkZWxldGUgbGlicmFyeS5pblxuICAgICAgZGVsZXRlIGxpYnJhcnkuc3dpdGNoXG4gICAgfVxuXG4gICAgT2JqZWN0LmFzc2lnbiggZGVzdGluYXRpb24sIGxpYnJhcnkgKVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBsaWJyYXJ5LCAnc2FtcGxlcmF0ZScsIHtcbiAgICAgIGdldCgpIHsgcmV0dXJuIGxpYnJhcnkuZ2VuLnNhbXBsZXJhdGUgfSxcbiAgICAgIHNldCh2KSB7fVxuICAgIH0pXG5cbiAgICBsaWJyYXJ5LmluID0gZGVzdGluYXRpb24uaW5wdXRcbiAgICBsaWJyYXJ5Lmhpc3RvcnkgPSBkZXN0aW5hdGlvbi5zc2RcbiAgICBsaWJyYXJ5LnN3aXRjaCA9IGRlc3RpbmF0aW9uLnRlcm5hcnlcblxuICAgIGRlc3RpbmF0aW9uLmNsaXAgPSBsaWJyYXJ5LmNsYW1wXG4gIH0sXG5cbiAgZ2VuOiAgICAgIHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgXG4gIGFiczogICAgICByZXF1aXJlKCAnLi9hYnMuanMnICksXG4gIHJvdW5kOiAgICByZXF1aXJlKCAnLi9yb3VuZC5qcycgKSxcbiAgcGFyYW06ICAgIHJlcXVpcmUoICcuL3BhcmFtLmpzJyApLFxuICBhZGQ6ICAgICAgcmVxdWlyZSggJy4vYWRkLmpzJyApLFxuICBzdWI6ICAgICAgcmVxdWlyZSggJy4vc3ViLmpzJyApLFxuICBtdWw6ICAgICAgcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICBkaXY6ICAgICAgcmVxdWlyZSggJy4vZGl2LmpzJyApLFxuICBhY2N1bTogICAgcmVxdWlyZSggJy4vYWNjdW0uanMnICksXG4gIGNvdW50ZXI6ICByZXF1aXJlKCAnLi9jb3VudGVyLmpzJyApLFxuICBzaW46ICAgICAgcmVxdWlyZSggJy4vc2luLmpzJyApLFxuICBjb3M6ICAgICAgcmVxdWlyZSggJy4vY29zLmpzJyApLFxuICB0YW46ICAgICAgcmVxdWlyZSggJy4vdGFuLmpzJyApLFxuICB0YW5oOiAgICAgcmVxdWlyZSggJy4vdGFuaC5qcycgKSxcbiAgYXNpbjogICAgIHJlcXVpcmUoICcuL2FzaW4uanMnICksXG4gIGFjb3M6ICAgICByZXF1aXJlKCAnLi9hY29zLmpzJyApLFxuICBhdGFuOiAgICAgcmVxdWlyZSggJy4vYXRhbi5qcycgKSwgIFxuICBwaGFzb3I6ICAgcmVxdWlyZSggJy4vcGhhc29yLmpzJyApLFxuICBkYXRhOiAgICAgcmVxdWlyZSggJy4vZGF0YS5qcycgKSxcbiAgcGVlazogICAgIHJlcXVpcmUoICcuL3BlZWsuanMnICksXG4gIGN5Y2xlOiAgICByZXF1aXJlKCAnLi9jeWNsZS5qcycgKSxcbiAgaGlzdG9yeTogIHJlcXVpcmUoICcuL2hpc3RvcnkuanMnICksXG4gIGRlbHRhOiAgICByZXF1aXJlKCAnLi9kZWx0YS5qcycgKSxcbiAgZmxvb3I6ICAgIHJlcXVpcmUoICcuL2Zsb29yLmpzJyApLFxuICBjZWlsOiAgICAgcmVxdWlyZSggJy4vY2VpbC5qcycgKSxcbiAgbWluOiAgICAgIHJlcXVpcmUoICcuL21pbi5qcycgKSxcbiAgbWF4OiAgICAgIHJlcXVpcmUoICcuL21heC5qcycgKSxcbiAgc2lnbjogICAgIHJlcXVpcmUoICcuL3NpZ24uanMnICksXG4gIGRjYmxvY2s6ICByZXF1aXJlKCAnLi9kY2Jsb2NrLmpzJyApLFxuICBtZW1vOiAgICAgcmVxdWlyZSggJy4vbWVtby5qcycgKSxcbiAgcmF0ZTogICAgIHJlcXVpcmUoICcuL3JhdGUuanMnICksXG4gIHdyYXA6ICAgICByZXF1aXJlKCAnLi93cmFwLmpzJyApLFxuICBtaXg6ICAgICAgcmVxdWlyZSggJy4vbWl4LmpzJyApLFxuICBjbGFtcDogICAgcmVxdWlyZSggJy4vY2xhbXAuanMnICksXG4gIHBva2U6ICAgICByZXF1aXJlKCAnLi9wb2tlLmpzJyApLFxuICBkZWxheTogICAgcmVxdWlyZSggJy4vZGVsYXkuanMnICksXG4gIGZvbGQ6ICAgICByZXF1aXJlKCAnLi9mb2xkLmpzJyApLFxuICBtb2QgOiAgICAgcmVxdWlyZSggJy4vbW9kLmpzJyApLFxuICBzYWggOiAgICAgcmVxdWlyZSggJy4vc2FoLmpzJyApLFxuICBub2lzZTogICAgcmVxdWlyZSggJy4vbm9pc2UuanMnICksXG4gIG5vdDogICAgICByZXF1aXJlKCAnLi9ub3QuanMnICksXG4gIGd0OiAgICAgICByZXF1aXJlKCAnLi9ndC5qcycgKSxcbiAgZ3RlOiAgICAgIHJlcXVpcmUoICcuL2d0ZS5qcycgKSxcbiAgbHQ6ICAgICAgIHJlcXVpcmUoICcuL2x0LmpzJyApLCBcbiAgbHRlOiAgICAgIHJlcXVpcmUoICcuL2x0ZS5qcycgKSwgXG4gIGJvb2w6ICAgICByZXF1aXJlKCAnLi9ib29sLmpzJyApLFxuICBnYXRlOiAgICAgcmVxdWlyZSggJy4vZ2F0ZS5qcycgKSxcbiAgdHJhaW46ICAgIHJlcXVpcmUoICcuL3RyYWluLmpzJyApLFxuICBzbGlkZTogICAgcmVxdWlyZSggJy4vc2xpZGUuanMnICksXG4gIGluOiAgICAgICByZXF1aXJlKCAnLi9pbi5qcycgKSxcbiAgdDYwOiAgICAgIHJlcXVpcmUoICcuL3Q2MC5qcycpLFxuICBtdG9mOiAgICAgcmVxdWlyZSggJy4vbXRvZi5qcycpLFxuICBsdHA6ICAgICAgcmVxdWlyZSggJy4vbHRwLmpzJyksICAgICAgICAvLyBUT0RPOiB0ZXN0XG4gIGd0cDogICAgICByZXF1aXJlKCAnLi9ndHAuanMnKSwgICAgICAgIC8vIFRPRE86IHRlc3RcbiAgc3dpdGNoOiAgIHJlcXVpcmUoICcuL3N3aXRjaC5qcycgKSxcbiAgbXN0b3NhbXBzOnJlcXVpcmUoICcuL21zdG9zYW1wcy5qcycgKSwgLy8gVE9ETzogbmVlZHMgdGVzdCxcbiAgc2VsZWN0b3I6IHJlcXVpcmUoICcuL3NlbGVjdG9yLmpzJyApLFxuICB1dGlsaXRpZXM6cmVxdWlyZSggJy4vdXRpbGl0aWVzLmpzJyApLFxuICBwb3c6ICAgICAgcmVxdWlyZSggJy4vcG93LmpzJyApLFxuICBhdHRhY2s6ICAgcmVxdWlyZSggJy4vYXR0YWNrLmpzJyApLFxuICBkZWNheTogICAgcmVxdWlyZSggJy4vZGVjYXkuanMnICksXG4gIHdpbmRvd3M6ICByZXF1aXJlKCAnLi93aW5kb3dzLmpzJyApLFxuICBlbnY6ICAgICAgcmVxdWlyZSggJy4vZW52LmpzJyApLFxuICBhZDogICAgICAgcmVxdWlyZSggJy4vYWQuanMnICApLFxuICBhZHNyOiAgICAgcmVxdWlyZSggJy4vYWRzci5qcycgKSxcbiAgaWZlbHNlOiAgIHJlcXVpcmUoICcuL2lmZWxzZWlmLmpzJyApLFxuICBiYW5nOiAgICAgcmVxdWlyZSggJy4vYmFuZy5qcycgKSxcbiAgYW5kOiAgICAgIHJlcXVpcmUoICcuL2FuZC5qcycgKSxcbiAgcGFuOiAgICAgIHJlcXVpcmUoICcuL3Bhbi5qcycgKSxcbiAgZXE6ICAgICAgIHJlcXVpcmUoICcuL2VxLmpzJyApLFxuICBuZXE6ICAgICAgcmVxdWlyZSggJy4vbmVxLmpzJyApLFxuICBleHA6ICAgICAgcmVxdWlyZSggJy4vZXhwLmpzJyApXG59XG5cbmxpYnJhcnkuZ2VuLmxpYiA9IGxpYnJhcnlcblxubW9kdWxlLmV4cG9ydHMgPSBsaWJyYXJ5XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J2x0JyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gYCAgXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgfHwgaXNOYU4oIHRoaXMuaW5wdXRzWzFdICkgKSB7XG4gICAgICBvdXQgKz0gYCgoICR7aW5wdXRzWzBdfSA8ICR7aW5wdXRzWzFdfSkgfCAwICApYFxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gaW5wdXRzWzBdIDwgaW5wdXRzWzFdID8gMSA6IDAgXG4gICAgfVxuICAgIG91dCArPSAnXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gW3RoaXMubmFtZSwgb3V0XVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh4LHkpID0+IHtcbiAgbGV0IGx0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGx0LmlucHV0cyA9IFsgeCx5IF1cbiAgbHQubmFtZSA9IGx0LmJhc2VuYW1lICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIGx0XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonbHRlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gYCAgXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgfHwgaXNOYU4oIHRoaXMuaW5wdXRzWzFdICkgKSB7XG4gICAgICBvdXQgKz0gYCggJHtpbnB1dHNbMF19IDw9ICR7aW5wdXRzWzFdfSB8IDAgIClgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCArPSBpbnB1dHNbMF0gPD0gaW5wdXRzWzFdID8gMSA6IDAgXG4gICAgfVxuICAgIG91dCArPSAnXFxuJ1xuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gW3RoaXMubmFtZSwgb3V0XVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh4LHkpID0+IHtcbiAgbGV0IGx0ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIGx0LmlucHV0cyA9IFsgeCx5IF1cbiAgbHQubmFtZSA9ICdsdGUnICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIGx0XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonbHRwJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIHRoaXMuaW5wdXRzWzBdICkgfHwgaXNOYU4oIHRoaXMuaW5wdXRzWzFdICkgKSB7XG4gICAgICBvdXQgPSBgKCR7aW5wdXRzWyAwIF19ICogKCggJHtpbnB1dHNbMF19IDwgJHtpbnB1dHNbMV19ICkgfCAwICkgKWAgXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IGlucHV0c1swXSAqICgoIGlucHV0c1swXSA8IGlucHV0c1sxXSApIHwgMCApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh4LHkpID0+IHtcbiAgbGV0IGx0cCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBsdHAuaW5wdXRzID0gWyB4LHkgXVxuXG4gIHJldHVybiBsdHBcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidtYXgnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgfHwgaXNOYU4oIGlucHV0c1sxXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IE1hdGgubWF4IH0pXG5cbiAgICAgIG91dCA9IGBnZW4ubWF4KCAke2lucHV0c1swXX0sICR7aW5wdXRzWzFdfSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGgubWF4KCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSwgcGFyc2VGbG9hdCggaW5wdXRzWzFdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoeCx5KSA9PiB7XG4gIGxldCBtYXggPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbWF4LmlucHV0cyA9IFsgeCx5IF1cblxuICByZXR1cm4gbWF4XG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonbWVtbycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZX0gPSAke2lucHV0c1swXX1cXG5gXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSB0aGlzLm5hbWVcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgb3V0IF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoaW4xLG1lbW9OYW1lKSA9PiB7XG4gIGxldCBtZW1vID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBcbiAgbWVtby5pbnB1dHMgPSBbIGluMSBdXG4gIG1lbW8uaWQgICA9IGdlbi5nZXRVSUQoKVxuICBtZW1vLm5hbWUgPSBtZW1vTmFtZSAhPT0gdW5kZWZpbmVkID8gbWVtb05hbWUgKyAnXycgKyBnZW4uZ2V0VUlEKCkgOiBgJHttZW1vLmJhc2VuYW1lfSR7bWVtby5pZH1gXG5cbiAgcmV0dXJuIG1lbW9cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidtaW4nLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgfHwgaXNOYU4oIGlucHV0c1sxXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IE1hdGgubWluIH0pXG5cbiAgICAgIG91dCA9IGBnZW4ubWluKCAke2lucHV0c1swXX0sICR7aW5wdXRzWzFdfSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IE1hdGgubWluKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSwgcGFyc2VGbG9hdCggaW5wdXRzWzFdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoeCx5KSA9PiB7XG4gIGxldCBtaW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgbWluLmlucHV0cyA9IFsgeCx5IF1cblxuICByZXR1cm4gbWluXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJyksXG4gICAgYWRkID0gcmVxdWlyZSgnLi9hZGQuanMnKSxcbiAgICBtdWwgPSByZXF1aXJlKCcuL211bC5qcycpLFxuICAgIHN1YiA9IHJlcXVpcmUoJy4vc3ViLmpzJyksXG4gICAgbWVtbz0gcmVxdWlyZSgnLi9tZW1vLmpzJylcblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgaW4yLCB0PS41ICkgPT4ge1xuICBsZXQgdWdlbiA9IG1lbW8oIGFkZCggbXVsKGluMSwgc3ViKDEsdCApICksIG11bCggaW4yLCB0ICkgKSApXG4gIHVnZW4ubmFtZSA9ICdtaXgnICsgZ2VuLmdldFVJRCgpXG5cbiAgcmV0dXJuIHVnZW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9ICguLi5hcmdzKSA9PiB7XG4gIGxldCBtb2QgPSB7XG4gICAgaWQ6ICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiBhcmdzLFxuXG4gICAgZ2VuKCkge1xuICAgICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgICBvdXQ9JygnLFxuICAgICAgICAgIGRpZmYgPSAwLCBcbiAgICAgICAgICBudW1Db3VudCA9IDAsXG4gICAgICAgICAgbGFzdE51bWJlciA9IGlucHV0c1sgMCBdLFxuICAgICAgICAgIGxhc3ROdW1iZXJJc1VnZW4gPSBpc05hTiggbGFzdE51bWJlciApLCBcbiAgICAgICAgICBtb2RBdEVuZCA9IGZhbHNlXG5cbiAgICAgIGlucHV0cy5mb3JFYWNoKCAodixpKSA9PiB7XG4gICAgICAgIGlmKCBpID09PSAwICkgcmV0dXJuXG5cbiAgICAgICAgbGV0IGlzTnVtYmVyVWdlbiA9IGlzTmFOKCB2ICksXG4gICAgICAgICAgICBpc0ZpbmFsSWR4ICAgPSBpID09PSBpbnB1dHMubGVuZ3RoIC0gMVxuXG4gICAgICAgIGlmKCAhbGFzdE51bWJlcklzVWdlbiAmJiAhaXNOdW1iZXJVZ2VuICkge1xuICAgICAgICAgIGxhc3ROdW1iZXIgPSBsYXN0TnVtYmVyICUgdlxuICAgICAgICAgIG91dCArPSBsYXN0TnVtYmVyXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIG91dCArPSBgJHtsYXN0TnVtYmVyfSAlICR7dn1gXG4gICAgICAgIH1cblxuICAgICAgICBpZiggIWlzRmluYWxJZHggKSBvdXQgKz0gJyAlICcgXG4gICAgICB9KVxuXG4gICAgICBvdXQgKz0gJyknXG5cbiAgICAgIHJldHVybiBvdXRcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBtb2Rcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonbXN0b3NhbXBzJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLFxuICAgICAgICByZXR1cm5WYWx1ZVxuXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIG91dCA9IGAgIHZhciAke3RoaXMubmFtZSB9ID0gJHtnZW4uc2FtcGxlcmF0ZX0gLyAxMDAwICogJHtpbnB1dHNbMF19IFxcblxcbmBcbiAgICAgXG4gICAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBvdXRcbiAgICAgIFxuICAgICAgcmV0dXJuVmFsdWUgPSBbIHRoaXMubmFtZSwgb3V0IF1cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gZ2VuLnNhbXBsZXJhdGUgLyAxMDAwICogdGhpcy5pbnB1dHNbMF1cblxuICAgICAgcmV0dXJuVmFsdWUgPSBvdXRcbiAgICB9ICAgIFxuXG4gICAgcmV0dXJuIHJldHVyblZhbHVlXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IG1zdG9zYW1wcyA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBtc3Rvc2FtcHMuaW5wdXRzID0gWyB4IF1cbiAgbXN0b3NhbXBzLm5hbWUgPSBwcm90by5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiBtc3Rvc2FtcHNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBuYW1lOidtdG9mJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IE1hdGguZXhwIH0pXG5cbiAgICAgIG91dCA9IGAoICR7dGhpcy50dW5pbmd9ICogZ2VuLmV4cCggLjA1Nzc2MjI2NSAqICgke2lucHV0c1swXX0gLSA2OSkgKSApYFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dCA9IHRoaXMudHVuaW5nICogTWF0aC5leHAoIC4wNTc3NjIyNjUgKiAoIGlucHV0c1swXSAtIDY5KSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggeCwgcHJvcHMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGRlZmF1bHRzID0geyB0dW5pbmc6NDQwIH1cbiAgXG4gIGlmKCBwcm9wcyAhPT0gdW5kZWZpbmVkICkgT2JqZWN0LmFzc2lnbiggcHJvcHMuZGVmYXVsdHMgKVxuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIGRlZmF1bHRzIClcbiAgdWdlbi5pbnB1dHMgPSBbIHggXVxuICBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxuY29uc3QgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOiAnbXVsJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9IGAsXG4gICAgICAgIHN1bSA9IDEsIG51bUNvdW50ID0gMCwgbXVsQXRFbmQgPSBmYWxzZSwgYWxyZWFkeUZ1bGxTdW1tZWQgPSB0cnVlXG5cbiAgICBpbnB1dHMuZm9yRWFjaCggKHYsaSkgPT4ge1xuICAgICAgaWYoIGlzTmFOKCB2ICkgKSB7XG4gICAgICAgIG91dCArPSB2XG4gICAgICAgIGlmKCBpIDwgaW5wdXRzLmxlbmd0aCAtMSApIHtcbiAgICAgICAgICBtdWxBdEVuZCA9IHRydWVcbiAgICAgICAgICBvdXQgKz0gJyAqICdcbiAgICAgICAgfVxuICAgICAgICBhbHJlYWR5RnVsbFN1bW1lZCA9IGZhbHNlXG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYoIGkgPT09IDAgKSB7XG4gICAgICAgICAgc3VtID0gdlxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBzdW0gKj0gcGFyc2VGbG9hdCggdiApXG4gICAgICAgIH1cbiAgICAgICAgbnVtQ291bnQrK1xuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiggbnVtQ291bnQgPiAwICkge1xuICAgICAgb3V0ICs9IG11bEF0RW5kIHx8IGFscmVhZHlGdWxsU3VtbWVkID8gc3VtIDogJyAqICcgKyBzdW1cbiAgICB9XG5cbiAgICBvdXQgKz0gJ1xcbidcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZVxuXG4gICAgcmV0dXJuIFsgdGhpcy5uYW1lLCBvdXQgXVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCAuLi5hcmdzICkgPT4ge1xuICBjb25zdCBtdWwgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIFxuICBPYmplY3QuYXNzaWduKCBtdWwsIHtcbiAgICAgIGlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgICAgaW5wdXRzOiBhcmdzLFxuICB9KVxuICBcbiAgbXVsLm5hbWUgPSBtdWwuYmFzZW5hbWUgKyBtdWwuaWRcblxuICByZXR1cm4gbXVsXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoICcuL2dlbi5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOiduZXEnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLCBvdXRcblxuICAgIG91dCA9IC8qdGhpcy5pbnB1dHNbMF0gIT09IHRoaXMuaW5wdXRzWzFdID8gMSA6Ki8gYCAgdmFyICR7dGhpcy5uYW1lfSA9ICgke2lucHV0c1swXX0gIT09ICR7aW5wdXRzWzFdfSkgfCAwXFxuXFxuYFxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsIG91dCBdXG4gIH0sXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgaW4yICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGluMSwgaW4yIF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZTonbm9pc2UnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0XG5cbiAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ25vaXNlJyA6IE1hdGgucmFuZG9tIH0pXG5cbiAgICBvdXQgPSBgICB2YXIgJHt0aGlzLm5hbWV9ID0gZ2VuLm5vaXNlKClcXG5gXG4gICAgXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gWyB0aGlzLm5hbWUsIG91dCBdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IG5vaXNlID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBub2lzZS5uYW1lID0gcHJvdG8ubmFtZSArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiBub2lzZVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J25vdCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuXG4gICAgaWYoIGlzTmFOKCB0aGlzLmlucHV0c1swXSApICkge1xuICAgICAgb3V0ID0gYCggJHtpbnB1dHNbMF19ID09PSAwID8gMSA6IDAgKWBcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gIWlucHV0c1swXSA9PT0gMCA/IDEgOiAwXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgbm90ID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIG5vdC5pbnB1dHMgPSBbIHggXVxuXG4gIHJldHVybiBub3Rcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIGRhdGEgPSByZXF1aXJlKCAnLi9kYXRhLmpzJyApLFxuICAgIHBlZWsgPSByZXF1aXJlKCAnLi9wZWVrLmpzJyApLFxuICAgIG11bCAgPSByZXF1aXJlKCAnLi9tdWwuanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZToncGFuJywgXG4gIGluaXRUYWJsZSgpIHsgICAgXG4gICAgbGV0IGJ1ZmZlckwgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0ICksXG4gICAgICAgIGJ1ZmZlclIgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0IClcblxuICAgIGNvbnN0IGFuZ1RvUmFkID0gTWF0aC5QSSAvIDE4MFxuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgMTAyNDsgaSsrICkgeyBcbiAgICAgIGxldCBwYW4gPSBpICogKCA5MCAvIDEwMjQgKVxuICAgICAgYnVmZmVyTFtpXSA9IE1hdGguY29zKCBwYW4gKiBhbmdUb1JhZCApIFxuICAgICAgYnVmZmVyUltpXSA9IE1hdGguc2luKCBwYW4gKiBhbmdUb1JhZCApXG4gICAgfVxuXG4gICAgZ2VuLmdsb2JhbHMucGFuTCA9IGRhdGEoIGJ1ZmZlckwsIDEsIHsgaW1tdXRhYmxlOnRydWUgfSlcbiAgICBnZW4uZ2xvYmFscy5wYW5SID0gZGF0YSggYnVmZmVyUiwgMSwgeyBpbW11dGFibGU6dHJ1ZSB9KVxuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGxlZnRJbnB1dCwgcmlnaHRJbnB1dCwgcGFuID0uNSwgcHJvcGVydGllcyApID0+IHtcbiAgaWYoIGdlbi5nbG9iYWxzLnBhbkwgPT09IHVuZGVmaW5lZCApIHByb3RvLmluaXRUYWJsZSgpXG5cbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwge1xuICAgIHVpZDogICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICBbIGxlZnRJbnB1dCwgcmlnaHRJbnB1dCBdLFxuICAgIGxlZnQ6ICAgIG11bCggbGVmdElucHV0LCBwZWVrKCBnZW4uZ2xvYmFscy5wYW5MLCBwYW4sIHsgYm91bmRtb2RlOidjbGFtcCcgfSkgKSxcbiAgICByaWdodDogICBtdWwoIHJpZ2h0SW5wdXQsIHBlZWsoIGdlbi5nbG9iYWxzLnBhblIsIHBhbiwgeyBib3VuZG1vZGU6J2NsYW1wJyB9KSApXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTogJ3BhcmFtJyxcblxuICBnZW4oKSB7XG4gICAgZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICBcbiAgICBnZW4ucGFyYW1zLmFkZCh7IFt0aGlzLm5hbWVdOiB0aGlzIH0pXG5cbiAgICB0aGlzLnZhbHVlID0gdGhpcy5pbml0aWFsVmFsdWVcblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGBtZW1vcnlbJHt0aGlzLm1lbW9yeS52YWx1ZS5pZHh9XWBcblxuICAgIHJldHVybiBnZW4ubWVtb1sgdGhpcy5uYW1lIF1cbiAgfSBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIHByb3BOYW1lPTAsIHZhbHVlPTAgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuICBcbiAgaWYoIHR5cGVvZiBwcm9wTmFtZSAhPT0gJ3N0cmluZycgKSB7XG4gICAgdWdlbi5uYW1lID0gdWdlbi5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuICAgIHVnZW4uaW5pdGlhbFZhbHVlID0gcHJvcE5hbWVcbiAgfWVsc2V7XG4gICAgdWdlbi5uYW1lID0gcHJvcE5hbWVcbiAgICB1Z2VuLmluaXRpYWxWYWx1ZSA9IHZhbHVlXG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHVnZW4sICd2YWx1ZScsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiggdGhpcy5tZW1vcnkudmFsdWUuaWR4ICE9PSBudWxsICkge1xuICAgICAgICByZXR1cm4gZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXVxuICAgICAgfVxuICAgIH0sXG4gICAgc2V0KCB2ICkge1xuICAgICAgaWYoIHRoaXMubWVtb3J5LnZhbHVlLmlkeCAhPT0gbnVsbCApIHtcbiAgICAgICAgZ2VuLm1lbW9yeS5oZWFwWyB0aGlzLm1lbW9yeS52YWx1ZS5pZHggXSA9IHYgXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIHVnZW4ubWVtb3J5ID0ge1xuICAgIHZhbHVlOiB7IGxlbmd0aDoxLCBpZHg6bnVsbCB9XG4gIH1cblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgICAgZGF0YVVnZW4gPSByZXF1aXJlKCcuL2RhdGEuanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidwZWVrJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGdlbk5hbWUgPSAnZ2VuLicgKyB0aGlzLm5hbWUsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0LCBmdW5jdGlvbkJvZHksIG5leHQsIGxlbmd0aElzTG9nMiwgaWR4XG4gICAgXG4gICAgaWR4ID0gaW5wdXRzWzFdXG4gICAgbGVuZ3RoSXNMb2cyID0gKE1hdGgubG9nMiggdGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggKSB8IDApICA9PT0gTWF0aC5sb2cyKCB0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aCApXG5cbiAgICBpZiggdGhpcy5tb2RlICE9PSAnc2ltcGxlJyApIHtcblxuICAgIGZ1bmN0aW9uQm9keSA9IGAgIHZhciAke3RoaXMubmFtZX1fZGF0YUlkeCAgPSAke2lkeH0sIFxuICAgICAgJHt0aGlzLm5hbWV9X3BoYXNlID0gJHt0aGlzLm1vZGUgPT09ICdzYW1wbGVzJyA/IGlucHV0c1swXSA6IGlucHV0c1swXSArICcgKiAnICsgKHRoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMSkgfSwgXG4gICAgICAke3RoaXMubmFtZX1faW5kZXggPSAke3RoaXMubmFtZX1fcGhhc2UgfCAwLFxcbmBcblxuICAgIGlmKCB0aGlzLmJvdW5kbW9kZSA9PT0gJ3dyYXAnICkge1xuICAgICAgbmV4dCA9IGxlbmd0aElzTG9nMiA/XG4gICAgICBgKCAke3RoaXMubmFtZX1faW5kZXggKyAxICkgJiAoJHt0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aH0gLSAxKWAgOlxuICAgICAgYCR7dGhpcy5uYW1lfV9pbmRleCArIDEgPj0gJHt0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aH0gPyAke3RoaXMubmFtZX1faW5kZXggKyAxIC0gJHt0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aH0gOiAke3RoaXMubmFtZX1faW5kZXggKyAxYFxuICAgIH1lbHNlIGlmKCB0aGlzLmJvdW5kbW9kZSA9PT0gJ2NsYW1wJyApIHtcbiAgICAgIG5leHQgPSBcbiAgICAgICAgYCR7dGhpcy5uYW1lfV9pbmRleCArIDEgPj0gJHt0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aCAtIDF9ID8gJHt0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aCAtIDF9IDogJHt0aGlzLm5hbWV9X2luZGV4ICsgMWBcbiAgICB9IGVsc2UgaWYoIHRoaXMuYm91bmRtb2RlID09PSAnZm9sZCcgfHwgdGhpcy5ib3VuZG1vZGUgPT09ICdtaXJyb3InICkge1xuICAgICAgbmV4dCA9IFxuICAgICAgICBgJHt0aGlzLm5hbWV9X2luZGV4ICsgMSA+PSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMX0gPyAke3RoaXMubmFtZX1faW5kZXggLSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMX0gOiAke3RoaXMubmFtZX1faW5kZXggKyAxYFxuICAgIH1lbHNle1xuICAgICAgIG5leHQgPSBcbiAgICAgIGAke3RoaXMubmFtZX1faW5kZXggKyAxYCAgICAgXG4gICAgfVxuXG4gICAgaWYoIHRoaXMuaW50ZXJwID09PSAnbGluZWFyJyApIHsgICAgICBcbiAgICBmdW5jdGlvbkJvZHkgKz0gYCAgICAgICR7dGhpcy5uYW1lfV9mcmFjICA9ICR7dGhpcy5uYW1lfV9waGFzZSAtICR7dGhpcy5uYW1lfV9pbmRleCxcbiAgICAgICR7dGhpcy5uYW1lfV9iYXNlICA9IG1lbW9yeVsgJHt0aGlzLm5hbWV9X2RhdGFJZHggKyAgJHt0aGlzLm5hbWV9X2luZGV4IF0sXG4gICAgICAke3RoaXMubmFtZX1fbmV4dCAgPSAke25leHR9LGBcbiAgICAgIFxuICAgICAgaWYoIHRoaXMuYm91bmRtb2RlID09PSAnaWdub3JlJyApIHtcbiAgICAgICAgZnVuY3Rpb25Cb2R5ICs9IGBcbiAgICAgICR7dGhpcy5uYW1lfV9vdXQgICA9ICR7dGhpcy5uYW1lfV9pbmRleCA+PSAke3RoaXMuZGF0YS5idWZmZXIubGVuZ3RoIC0gMX0gfHwgJHt0aGlzLm5hbWV9X2luZGV4IDwgMCA/IDAgOiAke3RoaXMubmFtZX1fYmFzZSArICR7dGhpcy5uYW1lfV9mcmFjICogKCBtZW1vcnlbICR7dGhpcy5uYW1lfV9kYXRhSWR4ICsgJHt0aGlzLm5hbWV9X25leHQgXSAtICR7dGhpcy5uYW1lfV9iYXNlIClcXG5cXG5gXG4gICAgICB9ZWxzZXtcbiAgICAgICAgZnVuY3Rpb25Cb2R5ICs9IGBcbiAgICAgICR7dGhpcy5uYW1lfV9vdXQgICA9ICR7dGhpcy5uYW1lfV9iYXNlICsgJHt0aGlzLm5hbWV9X2ZyYWMgKiAoIG1lbW9yeVsgJHt0aGlzLm5hbWV9X2RhdGFJZHggKyAke3RoaXMubmFtZX1fbmV4dCBdIC0gJHt0aGlzLm5hbWV9X2Jhc2UgKVxcblxcbmBcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGZ1bmN0aW9uQm9keSArPSBgICAgICAgJHt0aGlzLm5hbWV9X291dCA9IG1lbW9yeVsgJHt0aGlzLm5hbWV9X2RhdGFJZHggKyAke3RoaXMubmFtZX1faW5kZXggXVxcblxcbmBcbiAgICB9XG5cbiAgICB9IGVsc2UgeyAvLyBtb2RlIGlzIHNpbXBsZVxuICAgICAgZnVuY3Rpb25Cb2R5ID0gYG1lbW9yeVsgJHtpZHh9ICsgJHsgaW5wdXRzWzBdIH0gXWBcbiAgICAgIFxuICAgICAgcmV0dXJuIGZ1bmN0aW9uQm9keVxuICAgIH1cblxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IHRoaXMubmFtZSArICdfb3V0J1xuXG4gICAgcmV0dXJuIFsgdGhpcy5uYW1lKydfb3V0JywgZnVuY3Rpb25Cb2R5IF1cbiAgfSxcblxuICBkZWZhdWx0cyA6IHsgY2hhbm5lbHM6MSwgbW9kZToncGhhc2UnLCBpbnRlcnA6J2xpbmVhcicsIGJvdW5kbW9kZTond3JhcCcgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggaW5wdXRfZGF0YSwgaW5kZXg9MCwgcHJvcGVydGllcyApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgLy9jb25zb2xlLmxvZyggZGF0YVVnZW4sIGdlbi5kYXRhIClcblxuICAvLyBYWFggd2h5IGlzIGRhdGFVZ2VuIG5vdCB0aGUgYWN0dWFsIGZ1bmN0aW9uPyBzb21lIHR5cGUgb2YgYnJvd3NlcmlmeSBub25zZW5zZS4uLlxuICBjb25zdCBmaW5hbERhdGEgPSB0eXBlb2YgaW5wdXRfZGF0YS5iYXNlbmFtZSA9PT0gJ3VuZGVmaW5lZCcgPyBnZW4ubGliLmRhdGEoIGlucHV0X2RhdGEgKSA6IGlucHV0X2RhdGFcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCBcbiAgICB7IFxuICAgICAgJ2RhdGEnOiAgICAgZmluYWxEYXRhLFxuICAgICAgZGF0YU5hbWU6ICAgZmluYWxEYXRhLm5hbWUsXG4gICAgICB1aWQ6ICAgICAgICBnZW4uZ2V0VUlEKCksXG4gICAgICBpbnB1dHM6ICAgICBbIGluZGV4LCBmaW5hbERhdGEgXSxcbiAgICB9LFxuICAgIHByb3RvLmRlZmF1bHRzLFxuICAgIHByb3BlcnRpZXMgXG4gIClcbiAgXG4gIHVnZW4ubmFtZSA9IHVnZW4uYmFzZW5hbWUgKyB1Z2VuLnVpZFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIGFjY3VtID0gcmVxdWlyZSggJy4vYWNjdW0uanMnICksXG4gICAgbXVsICAgPSByZXF1aXJlKCAnLi9tdWwuanMnICksXG4gICAgcHJvdG8gPSB7IGJhc2VuYW1lOidwaGFzb3InIH0sXG4gICAgZGl2ICAgPSByZXF1aXJlKCAnLi9kaXYuanMnIClcblxuY29uc3QgZGVmYXVsdHMgPSB7IG1pbjogLTEsIG1heDogMSB9XG5cbm1vZHVsZS5leHBvcnRzID0gKCBmcmVxdWVuY3kgPSAxLCByZXNldCA9IDAsIF9wcm9wcyApID0+IHtcbiAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgZGVmYXVsdHMsIF9wcm9wcyApXG5cbiAgY29uc3QgcmFuZ2UgPSBwcm9wcy5tYXggLSBwcm9wcy5taW5cblxuICBjb25zdCB1Z2VuID0gdHlwZW9mIGZyZXF1ZW5jeSA9PT0gJ251bWJlcicgXG4gICAgPyBhY2N1bSggKGZyZXF1ZW5jeSAqIHJhbmdlKSAvIGdlbi5zYW1wbGVyYXRlLCByZXNldCwgcHJvcHMgKSBcbiAgICA6IGFjY3VtKCBcbiAgICAgICAgZGl2KCBcbiAgICAgICAgICBtdWwoIGZyZXF1ZW5jeSwgcmFuZ2UgKSxcbiAgICAgICAgICBnZW4uc2FtcGxlcmF0ZVxuICAgICAgICApLCBcbiAgICAgICAgcmVzZXQsIHByb3BzIFxuICAgIClcblxuICB1Z2VuLm5hbWUgPSBwcm90by5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpLFxuICAgIG11bCAgPSByZXF1aXJlKCcuL211bC5qcycpLFxuICAgIHdyYXAgPSByZXF1aXJlKCcuL3dyYXAuanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidwb2tlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGRhdGFOYW1lID0gJ21lbW9yeScsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgaWR4LCBvdXQsIHdyYXBwZWRcbiAgICBcbiAgICBpZHggPSB0aGlzLmRhdGEuZ2VuKClcblxuICAgIC8vZ2VuLnJlcXVlc3RNZW1vcnkoIHRoaXMubWVtb3J5IClcbiAgICAvL3dyYXBwZWQgPSB3cmFwKCB0aGlzLmlucHV0c1sxXSwgMCwgdGhpcy5kYXRhTGVuZ3RoICkuZ2VuKClcbiAgICAvL2lkeCA9IHdyYXBwZWRbMF1cbiAgICAvL2dlbi5mdW5jdGlvbkJvZHkgKz0gd3JhcHBlZFsxXVxuICAgIGxldCBvdXRwdXRTdHIgPSB0aGlzLmlucHV0c1sxXSA9PT0gMCA/XG4gICAgICBgICAke2RhdGFOYW1lfVsgJHtpZHh9IF0gPSAke2lucHV0c1swXX1cXG5gIDpcbiAgICAgIGAgICR7ZGF0YU5hbWV9WyAke2lkeH0gKyAke2lucHV0c1sxXX0gXSA9ICR7aW5wdXRzWzBdfVxcbmBcblxuICAgIGlmKCB0aGlzLmlubGluZSA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgZ2VuLmZ1bmN0aW9uQm9keSArPSBvdXRwdXRTdHJcbiAgICB9ZWxzZXtcbiAgICAgIHJldHVybiBbIHRoaXMuaW5saW5lLCBvdXRwdXRTdHIgXVxuICAgIH1cbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSAoIGRhdGEsIHZhbHVlLCBpbmRleCwgcHJvcGVydGllcyApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApLFxuICAgICAgZGVmYXVsdHMgPSB7IGNoYW5uZWxzOjEgfSBcblxuICBpZiggcHJvcGVydGllcyAhPT0gdW5kZWZpbmVkICkgT2JqZWN0LmFzc2lnbiggZGVmYXVsdHMsIHByb3BlcnRpZXMgKVxuXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHsgXG4gICAgZGF0YSxcbiAgICBkYXRhTmFtZTogICBkYXRhLm5hbWUsXG4gICAgZGF0YUxlbmd0aDogZGF0YS5idWZmZXIubGVuZ3RoLFxuICAgIHVpZDogICAgICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICAgICBbIHZhbHVlLCBpbmRleCBdLFxuICB9LFxuICBkZWZhdWx0cyApXG5cblxuICB1Z2VuLm5hbWUgPSB1Z2VuLmJhc2VuYW1lICsgdWdlbi51aWRcbiAgXG4gIGdlbi5oaXN0b3JpZXMuc2V0KCB1Z2VuLm5hbWUsIHVnZW4gKVxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgYmFzZW5hbWU6J3BvdycsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgfHwgaXNOYU4oIGlucHV0c1sxXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7ICdwb3cnOiBNYXRoLnBvdyB9KVxuXG4gICAgICBvdXQgPSBgZ2VuLnBvdyggJHtpbnB1dHNbMF19LCAke2lucHV0c1sxXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgaWYoIHR5cGVvZiBpbnB1dHNbMF0gPT09ICdzdHJpbmcnICYmIGlucHV0c1swXVswXSA9PT0gJygnICkge1xuICAgICAgICBpbnB1dHNbMF0gPSBpbnB1dHNbMF0uc2xpY2UoMSwtMSlcbiAgICAgIH1cbiAgICAgIGlmKCB0eXBlb2YgaW5wdXRzWzFdID09PSAnc3RyaW5nJyAmJiBpbnB1dHNbMV1bMF0gPT09ICcoJyApIHtcbiAgICAgICAgaW5wdXRzWzFdID0gaW5wdXRzWzFdLnNsaWNlKDEsLTEpXG4gICAgICB9XG5cbiAgICAgIG91dCA9IE1hdGgucG93KCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSwgcGFyc2VGbG9hdCggaW5wdXRzWzFdKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICh4LHkpID0+IHtcbiAgbGV0IHBvdyA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBwb3cuaW5wdXRzID0gWyB4LHkgXVxuICBwb3cuaWQgPSBnZW4uZ2V0VUlEKClcbiAgcG93Lm5hbWUgPSBgJHtwb3cuYmFzZW5hbWV9e3Bvdy5pZH1gXG5cbiAgcmV0dXJuIHBvd1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gICAgID0gcmVxdWlyZSggJy4vZ2VuLmpzJyApLFxuICAgIGhpc3RvcnkgPSByZXF1aXJlKCAnLi9oaXN0b3J5LmpzJyApLFxuICAgIHN1YiAgICAgPSByZXF1aXJlKCAnLi9zdWIuanMnICksXG4gICAgYWRkICAgICA9IHJlcXVpcmUoICcuL2FkZC5qcycgKSxcbiAgICBtdWwgICAgID0gcmVxdWlyZSggJy4vbXVsLmpzJyApLFxuICAgIG1lbW8gICAgPSByZXF1aXJlKCAnLi9tZW1vLmpzJyApLFxuICAgIGRlbHRhICAgPSByZXF1aXJlKCAnLi9kZWx0YS5qcycgKSxcbiAgICB3cmFwICAgID0gcmVxdWlyZSggJy4vd3JhcC5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidyYXRlJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgcGhhc2UgID0gaGlzdG9yeSgpLFxuICAgICAgICBpbk1pbnVzMSA9IGhpc3RvcnkoKSxcbiAgICAgICAgZ2VuTmFtZSA9ICdnZW4uJyArIHRoaXMubmFtZSxcbiAgICAgICAgZmlsdGVyLCBzdW0sIG91dFxuXG4gICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgdGhpcy5uYW1lIF06IHRoaXMgfSkgXG5cbiAgICBvdXQgPSBcbmAgdmFyICR7dGhpcy5uYW1lfV9kaWZmID0gJHtpbnB1dHNbMF19IC0gJHtnZW5OYW1lfS5sYXN0U2FtcGxlXG4gIGlmKCAke3RoaXMubmFtZX1fZGlmZiA8IC0uNSApICR7dGhpcy5uYW1lfV9kaWZmICs9IDFcbiAgJHtnZW5OYW1lfS5waGFzZSArPSAke3RoaXMubmFtZX1fZGlmZiAqICR7aW5wdXRzWzFdfVxuICBpZiggJHtnZW5OYW1lfS5waGFzZSA+IDEgKSAke2dlbk5hbWV9LnBoYXNlIC09IDFcbiAgJHtnZW5OYW1lfS5sYXN0U2FtcGxlID0gJHtpbnB1dHNbMF19XG5gXG4gICAgb3V0ID0gJyAnICsgb3V0XG5cbiAgICByZXR1cm4gWyBnZW5OYW1lICsgJy5waGFzZScsIG91dCBdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgcmF0ZSApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBwaGFzZTogICAgICAwLFxuICAgIGxhc3RTYW1wbGU6IDAsXG4gICAgdWlkOiAgICAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogICAgIFsgaW4xLCByYXRlIF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCIndXNlIHN0cmljdCdcblxubGV0IGdlbiAgPSByZXF1aXJlKCcuL2dlbi5qcycpXG5cbmxldCBwcm90byA9IHtcbiAgbmFtZToncm91bmQnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgWyB0aGlzLm5hbWUgXTogTWF0aC5yb3VuZCB9KVxuXG4gICAgICBvdXQgPSBgZ2VuLnJvdW5kKCAke2lucHV0c1swXX0gKWBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLnJvdW5kKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgcm91bmQgPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG5cbiAgcm91bmQuaW5wdXRzID0gWyB4IF1cblxuICByZXR1cm4gcm91bmRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidzYWgnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLCBvdXRcblxuICAgIC8vZ2VuLmRhdGFbIHRoaXMubmFtZSBdID0gMFxuICAgIC8vZ2VuLmRhdGFbIHRoaXMubmFtZSArICdfY29udHJvbCcgXSA9IDBcblxuICAgIGdlbi5yZXF1ZXN0TWVtb3J5KCB0aGlzLm1lbW9yeSApXG5cblxuICAgIG91dCA9IFxuYCB2YXIgJHt0aGlzLm5hbWV9X2NvbnRyb2wgPSBtZW1vcnlbJHt0aGlzLm1lbW9yeS5jb250cm9sLmlkeH1dLFxuICAgICAgJHt0aGlzLm5hbWV9X3RyaWdnZXIgPSAke2lucHV0c1sxXX0gPiAke2lucHV0c1syXX0gPyAxIDogMFxuXG4gIGlmKCAke3RoaXMubmFtZX1fdHJpZ2dlciAhPT0gJHt0aGlzLm5hbWV9X2NvbnRyb2wgICkge1xuICAgIGlmKCAke3RoaXMubmFtZX1fdHJpZ2dlciA9PT0gMSApIFxuICAgICAgbWVtb3J5WyR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fV0gPSAke2lucHV0c1swXX1cbiAgICBcbiAgICBtZW1vcnlbJHt0aGlzLm1lbW9yeS5jb250cm9sLmlkeH1dID0gJHt0aGlzLm5hbWV9X3RyaWdnZXJcbiAgfVxuYFxuICAgIFxuICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IGBnZW4uZGF0YS4ke3RoaXMubmFtZX1gXG5cbiAgICByZXR1cm4gWyBgbWVtb3J5WyR7dGhpcy5tZW1vcnkudmFsdWUuaWR4fV1gLCAnICcgK291dCBdXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgY29udHJvbCwgdGhyZXNob2xkPTAsIHByb3BlcnRpZXMgKSA9PiB7XG4gIGxldCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgIGRlZmF1bHRzID0geyBpbml0OjAgfVxuXG4gIGlmKCBwcm9wZXJ0aWVzICE9PSB1bmRlZmluZWQgKSBPYmplY3QuYXNzaWduKCBkZWZhdWx0cywgcHJvcGVydGllcyApXG5cbiAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBcbiAgICBsYXN0U2FtcGxlOiAwLFxuICAgIHVpZDogICAgICAgIGdlbi5nZXRVSUQoKSxcbiAgICBpbnB1dHM6ICAgICBbIGluMSwgY29udHJvbCx0aHJlc2hvbGQgXSxcbiAgICBtZW1vcnk6IHtcbiAgICAgIGNvbnRyb2w6IHsgaWR4Om51bGwsIGxlbmd0aDoxIH0sXG4gICAgICB2YWx1ZTogICB7IGlkeDpudWxsLCBsZW5ndGg6MSB9LFxuICAgIH1cbiAgfSxcbiAgZGVmYXVsdHMgKVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonc2VsZWN0b3InLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApLCBvdXQsIHJldHVyblZhbHVlID0gMFxuICAgIFxuICAgIHN3aXRjaCggaW5wdXRzLmxlbmd0aCApIHtcbiAgICAgIGNhc2UgMiA6XG4gICAgICAgIHJldHVyblZhbHVlID0gaW5wdXRzWzFdXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzIDpcbiAgICAgICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfV9vdXQgPSAke2lucHV0c1swXX0gPT09IDEgPyAke2lucHV0c1sxXX0gOiAke2lucHV0c1syXX1cXG5cXG5gO1xuICAgICAgICByZXR1cm5WYWx1ZSA9IFsgdGhpcy5uYW1lICsgJ19vdXQnLCBvdXQgXVxuICAgICAgICBicmVhazsgIFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgb3V0ID0gXG5gIHZhciAke3RoaXMubmFtZX1fb3V0ID0gMFxuICBzd2l0Y2goICR7aW5wdXRzWzBdfSArIDEgKSB7XFxuYFxuXG4gICAgICAgIGZvciggbGV0IGkgPSAxOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSsrICl7XG4gICAgICAgICAgb3V0ICs9YCAgICBjYXNlICR7aX06ICR7dGhpcy5uYW1lfV9vdXQgPSAke2lucHV0c1tpXX07IGJyZWFrO1xcbmAgXG4gICAgICAgIH1cblxuICAgICAgICBvdXQgKz0gJyAgfVxcblxcbidcbiAgICAgICAgXG4gICAgICAgIHJldHVyblZhbHVlID0gWyB0aGlzLm5hbWUgKyAnX291dCcsICcgJyArIG91dCBdXG4gICAgfVxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lICsgJ19vdXQnXG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIC4uLmlucHV0cyApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIFxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7XG4gICAgdWlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0c1xuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIG5hbWU6J3NpZ24nLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzIClcblxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgWyB0aGlzLm5hbWUgXTogTWF0aC5zaWduIH0pXG5cbiAgICAgIG91dCA9IGBnZW4uc2lnbiggJHtpbnB1dHNbMF19IClgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC5zaWduKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgc2lnbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBzaWduLmlucHV0cyA9IFsgeCBdXG5cbiAgcmV0dXJuIHNpZ25cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonc2luJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAnc2luJzogTWF0aC5zaW4gfSlcblxuICAgICAgb3V0ID0gYGdlbi5zaW4oICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLnNpbiggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IHNpbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBzaW4uaW5wdXRzID0gWyB4IF1cbiAgc2luLmlkID0gZ2VuLmdldFVJRCgpXG4gIHNpbi5uYW1lID0gYCR7c2luLmJhc2VuYW1lfXtzaW4uaWR9YFxuXG4gIHJldHVybiBzaW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBoaXN0b3J5ID0gcmVxdWlyZSggJy4vaGlzdG9yeS5qcycgKSxcbiAgICBzdWIgICAgID0gcmVxdWlyZSggJy4vc3ViLmpzJyApLFxuICAgIGFkZCAgICAgPSByZXF1aXJlKCAnLi9hZGQuanMnICksXG4gICAgbXVsICAgICA9IHJlcXVpcmUoICcuL211bC5qcycgKSxcbiAgICBtZW1vICAgID0gcmVxdWlyZSggJy4vbWVtby5qcycgKSxcbiAgICBndCAgICAgID0gcmVxdWlyZSggJy4vZ3QuanMnICksXG4gICAgZGl2ICAgICA9IHJlcXVpcmUoICcuL2Rpdi5qcycgKSxcbiAgICBfc3dpdGNoID0gcmVxdWlyZSggJy4vc3dpdGNoLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gKCBpbjEsIHNsaWRlVXAgPSAxLCBzbGlkZURvd24gPSAxICkgPT4ge1xuICBsZXQgeTEgPSBoaXN0b3J5KDApLFxuICAgICAgZmlsdGVyLCBzbGlkZUFtb3VudFxuXG4gIC8veSAobikgPSB5IChuLTEpICsgKCh4IChuKSAtIHkgKG4tMSkpL3NsaWRlKSBcbiAgc2xpZGVBbW91bnQgPSBfc3dpdGNoKCBndChpbjEseTEub3V0KSwgc2xpZGVVcCwgc2xpZGVEb3duIClcblxuICBmaWx0ZXIgPSBtZW1vKCBhZGQoIHkxLm91dCwgZGl2KCBzdWIoIGluMSwgeTEub3V0ICksIHNsaWRlQW1vdW50ICkgKSApXG5cbiAgeTEuaW4oIGZpbHRlciApXG5cbiAgcmV0dXJuIGZpbHRlclxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGdlbiA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxuY29uc3QgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOidzdWInLFxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSxcbiAgICAgICAgb3V0PTAsXG4gICAgICAgIGRpZmYgPSAwLFxuICAgICAgICBuZWVkc1BhcmVucyA9IGZhbHNlLCBcbiAgICAgICAgbnVtQ291bnQgPSAwLFxuICAgICAgICBsYXN0TnVtYmVyID0gaW5wdXRzWyAwIF0sXG4gICAgICAgIGxhc3ROdW1iZXJJc1VnZW4gPSBpc05hTiggbGFzdE51bWJlciApLCBcbiAgICAgICAgc3ViQXRFbmQgPSBmYWxzZSxcbiAgICAgICAgaGFzVWdlbnMgPSBmYWxzZSxcbiAgICAgICAgcmV0dXJuVmFsdWUgPSAwXG5cbiAgICB0aGlzLmlucHV0cy5mb3JFYWNoKCB2YWx1ZSA9PiB7IGlmKCBpc05hTiggdmFsdWUgKSApIGhhc1VnZW5zID0gdHJ1ZSB9KVxuXG4gICAgb3V0ID0gJyAgdmFyICcgKyB0aGlzLm5hbWUgKyAnID0gJ1xuXG4gICAgaW5wdXRzLmZvckVhY2goICh2LGkpID0+IHtcbiAgICAgIGlmKCBpID09PSAwICkgcmV0dXJuXG5cbiAgICAgIGxldCBpc051bWJlclVnZW4gPSBpc05hTiggdiApLFxuICAgICAgICAgIGlzRmluYWxJZHggICA9IGkgPT09IGlucHV0cy5sZW5ndGggLSAxXG5cbiAgICAgIGlmKCAhbGFzdE51bWJlcklzVWdlbiAmJiAhaXNOdW1iZXJVZ2VuICkge1xuICAgICAgICBsYXN0TnVtYmVyID0gbGFzdE51bWJlciAtIHZcbiAgICAgICAgb3V0ICs9IGxhc3ROdW1iZXJcbiAgICAgICAgcmV0dXJuXG4gICAgICB9ZWxzZXtcbiAgICAgICAgbmVlZHNQYXJlbnMgPSB0cnVlXG4gICAgICAgIG91dCArPSBgJHtsYXN0TnVtYmVyfSAtICR7dn1gXG4gICAgICB9XG5cbiAgICAgIGlmKCAhaXNGaW5hbElkeCApIG91dCArPSAnIC0gJyBcbiAgICB9KVxuXG4gICAgb3V0ICs9ICdcXG4nXG5cbiAgICByZXR1cm5WYWx1ZSA9IFsgdGhpcy5uYW1lLCBvdXQgXVxuXG4gICAgZ2VuLm1lbW9bIHRoaXMubmFtZSBdID0gdGhpcy5uYW1lXG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCAuLi5hcmdzICkgPT4ge1xuICBsZXQgc3ViID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKVxuXG4gIE9iamVjdC5hc3NpZ24oIHN1Yiwge1xuICAgIGlkOiAgICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogYXJnc1xuICB9KVxuICAgICAgIFxuICBzdWIubmFtZSA9ICdzdWInICsgc3ViLmlkXG5cbiAgcmV0dXJuIHN1YlxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnIClcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTonc3dpdGNoJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKSwgb3V0XG5cbiAgICBpZiggaW5wdXRzWzFdID09PSBpbnB1dHNbMl0gKSByZXR1cm4gaW5wdXRzWzFdIC8vIGlmIGJvdGggcG90ZW50aWFsIG91dHB1dHMgYXJlIHRoZSBzYW1lIGp1c3QgcmV0dXJuIG9uZSBvZiB0aGVtXG4gICAgXG4gICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfV9vdXQgPSAke2lucHV0c1swXX0gPT09IDEgPyAke2lucHV0c1sxXX0gOiAke2lucHV0c1syXX1cXG5gXG5cbiAgICBnZW4ubWVtb1sgdGhpcy5uYW1lIF0gPSBgJHt0aGlzLm5hbWV9X291dGBcblxuICAgIHJldHVybiBbIGAke3RoaXMubmFtZX1fb3V0YCwgb3V0IF1cbiAgfSxcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICggY29udHJvbCwgaW4xID0gMSwgaW4yID0gMCApID0+IHtcbiAgbGV0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCBwcm90byApXG4gIE9iamVjdC5hc3NpZ24oIHVnZW4sIHtcbiAgICB1aWQ6ICAgICBnZW4uZ2V0VUlEKCksXG4gICAgaW5wdXRzOiAgWyBjb250cm9sLCBpbjEsIGluMiBdLFxuICB9KVxuICBcbiAgdWdlbi5uYW1lID0gYCR7dWdlbi5iYXNlbmFtZX0ke3VnZW4udWlkfWBcblxuICByZXR1cm4gdWdlblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gID0gcmVxdWlyZSgnLi9nZW4uanMnKVxuXG5sZXQgcHJvdG8gPSB7XG4gIGJhc2VuYW1lOid0NjAnLFxuXG4gIGdlbigpIHtcbiAgICBsZXQgb3V0LFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIHJldHVyblZhbHVlXG5cbiAgICBpZiggaXNOYU4oIGlucHV0c1swXSApICkge1xuICAgICAgZ2VuLmNsb3N1cmVzLmFkZCh7IFsgJ2V4cCcgXTogTWF0aC5leHAgfSlcblxuICAgICAgb3V0ID0gYCAgdmFyICR7dGhpcy5uYW1lfSA9IGdlbi5leHAoIC02LjkwNzc1NTI3ODkyMSAvICR7aW5wdXRzWzBdfSApXFxuXFxuYFxuICAgICBcbiAgICAgIGdlbi5tZW1vWyB0aGlzLm5hbWUgXSA9IG91dFxuICAgICAgXG4gICAgICByZXR1cm5WYWx1ZSA9IFsgdGhpcy5uYW1lLCBvdXQgXVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLmV4cCggLTYuOTA3NzU1Mjc4OTIxIC8gaW5wdXRzWzBdIClcblxuICAgICAgcmV0dXJuVmFsdWUgPSBvdXRcbiAgICB9ICAgIFxuXG4gICAgcmV0dXJuIHJldHVyblZhbHVlXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IHQ2MCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICB0NjAuaW5wdXRzID0gWyB4IF1cbiAgdDYwLm5hbWUgPSBwcm90by5iYXNlbmFtZSArIGdlbi5nZXRVSUQoKVxuXG4gIHJldHVybiB0NjBcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTondGFuJyxcblxuICBnZW4oKSB7XG4gICAgbGV0IG91dCxcbiAgICAgICAgaW5wdXRzID0gZ2VuLmdldElucHV0cyggdGhpcyApXG4gICAgXG4gICAgaWYoIGlzTmFOKCBpbnB1dHNbMF0gKSApIHtcbiAgICAgIGdlbi5jbG9zdXJlcy5hZGQoeyAndGFuJzogTWF0aC50YW4gfSlcblxuICAgICAgb3V0ID0gYGdlbi50YW4oICR7aW5wdXRzWzBdfSApYCBcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgPSBNYXRoLnRhbiggcGFyc2VGbG9hdCggaW5wdXRzWzBdICkgKVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcbiAgbGV0IHRhbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICB0YW4uaW5wdXRzID0gWyB4IF1cbiAgdGFuLmlkID0gZ2VuLmdldFVJRCgpXG4gIHRhbi5uYW1lID0gYCR7dGFuLmJhc2VuYW1lfXt0YW4uaWR9YFxuXG4gIHJldHVybiB0YW5cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTondGFuaCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBvdXQsXG4gICAgICAgIGlucHV0cyA9IGdlbi5nZXRJbnB1dHMoIHRoaXMgKVxuICAgIFxuICAgIGlmKCBpc05hTiggaW5wdXRzWzBdICkgKSB7XG4gICAgICBnZW4uY2xvc3VyZXMuYWRkKHsgJ3RhbmgnOiBNYXRoLnRhbmggfSlcblxuICAgICAgb3V0ID0gYGdlbi50YW5oKCAke2lucHV0c1swXX0gKWAgXG5cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gTWF0aC50YW5oKCBwYXJzZUZsb2F0KCBpbnB1dHNbMF0gKSApXG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHggPT4ge1xuICBsZXQgdGFuaCA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICB0YW5oLmlucHV0cyA9IFsgeCBdXG4gIHRhbmguaWQgPSBnZW4uZ2V0VUlEKClcbiAgdGFuaC5uYW1lID0gYCR7dGFuaC5iYXNlbmFtZX17dGFuaC5pZH1gXG5cbiAgcmV0dXJuIHRhbmhcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICAgICA9IHJlcXVpcmUoICcuL2dlbi5qcycgKSxcbiAgICBsdCAgICAgID0gcmVxdWlyZSggJy4vbHQuanMnICksXG4gICAgYWNjdW0gICA9IHJlcXVpcmUoICcuL2FjY3VtLmpzJyApLFxuICAgIGRpdiAgICAgPSByZXF1aXJlKCAnLi9kaXYuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSAoIGZyZXF1ZW5jeT00NDAsIHB1bHNld2lkdGg9LjUgKSA9PiB7XG4gIGxldCBncmFwaCA9IGx0KCBhY2N1bSggZGl2KCBmcmVxdWVuY3ksIDQ0MTAwICkgKSwgcHVsc2V3aWR0aCApXG5cbiAgZ3JhcGgubmFtZSA9IGB0cmFpbiR7Z2VuLmdldFVJRCgpfWBcblxuICByZXR1cm4gZ3JhcGhcbn1cblxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBnZW4gPSByZXF1aXJlKCAnLi9nZW4uanMnICksXG4gICAgZGF0YSA9IHJlcXVpcmUoICcuL2RhdGEuanMnIClcblxubGV0IGlzU3RlcmVvID0gZmFsc2VcblxubGV0IHV0aWxpdGllcyA9IHtcbiAgY3R4OiBudWxsLFxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuY2FsbGJhY2sgPSAoKSA9PiAwXG4gICAgdGhpcy5jbGVhci5jYWxsYmFja3MuZm9yRWFjaCggdiA9PiB2KCkgKVxuICAgIHRoaXMuY2xlYXIuY2FsbGJhY2tzLmxlbmd0aCA9IDBcbiAgfSxcblxuICBjcmVhdGVDb250ZXh0KCkge1xuICAgIGxldCBBQyA9IHR5cGVvZiBBdWRpb0NvbnRleHQgPT09ICd1bmRlZmluZWQnID8gd2Via2l0QXVkaW9Db250ZXh0IDogQXVkaW9Db250ZXh0XG4gICAgdGhpcy5jdHggPSBuZXcgQUMoKVxuXG4gICAgZ2VuLnNhbXBsZXJhdGUgPSB0aGlzLmN0eC5zYW1wbGVSYXRlXG5cbiAgICBsZXQgc3RhcnQgPSAoKSA9PiB7XG4gICAgICBpZiggdHlwZW9mIEFDICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaWYoIGRvY3VtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgKSB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgc3RhcnQgKVxuXG4gICAgICAgICAgaWYoICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCApIHsgLy8gcmVxdWlyZWQgdG8gc3RhcnQgYXVkaW8gdW5kZXIgaU9TIDZcbiAgICAgICAgICAgICBsZXQgbXlTb3VyY2UgPSB1dGlsaXRpZXMuY3R4LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpXG4gICAgICAgICAgICAgbXlTb3VyY2UuY29ubmVjdCggdXRpbGl0aWVzLmN0eC5kZXN0aW5hdGlvbiApXG4gICAgICAgICAgICAgbXlTb3VyY2Uubm90ZU9uKCAwIClcbiAgICAgICAgICAgfVxuICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmKCBkb2N1bWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgc3RhcnQgKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH0sXG5cbiAgY3JlYXRlU2NyaXB0UHJvY2Vzc29yKCkge1xuICAgIHRoaXMubm9kZSA9IHRoaXMuY3R4LmNyZWF0ZVNjcmlwdFByb2Nlc3NvciggMTAyNCwgMCwgMiApXG4gICAgdGhpcy5jbGVhckZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAwIH1cbiAgICBpZiggdHlwZW9mIHRoaXMuY2FsbGJhY2sgPT09ICd1bmRlZmluZWQnICkgdGhpcy5jYWxsYmFjayA9IHRoaXMuY2xlYXJGdW5jdGlvblxuXG4gICAgdGhpcy5ub2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oIGF1ZGlvUHJvY2Vzc2luZ0V2ZW50ICkge1xuICAgICAgdmFyIG91dHB1dEJ1ZmZlciA9IGF1ZGlvUHJvY2Vzc2luZ0V2ZW50Lm91dHB1dEJ1ZmZlcjtcblxuICAgICAgdmFyIGxlZnQgPSBvdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICByaWdodD0gb3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKCAxICksXG4gICAgICAgICAgaXNTdGVyZW8gPSB1dGlsaXRpZXMuaXNTdGVyZW9cblxuICAgICBmb3IoIHZhciBzYW1wbGUgPSAwOyBzYW1wbGUgPCBsZWZ0Lmxlbmd0aDsgc2FtcGxlKysgKSB7XG4gICAgICAgIHZhciBvdXQgPSB1dGlsaXRpZXMuY2FsbGJhY2soKVxuXG4gICAgICAgIGlmKCBpc1N0ZXJlbyA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgbGVmdFsgc2FtcGxlIF0gPSByaWdodFsgc2FtcGxlIF0gPSBvdXQgXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGxlZnRbIHNhbXBsZSAgXSA9IG91dFswXVxuICAgICAgICAgIHJpZ2h0WyBzYW1wbGUgXSA9IG91dFsxXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ub2RlLmNvbm5lY3QoIHRoaXMuY3R4LmRlc3RpbmF0aW9uIClcblxuICAgIHJldHVybiB0aGlzXG4gIH0sXG4gIFxuICBwbGF5R3JhcGgoIGdyYXBoLCBkZWJ1ZywgbWVtPTQ0MTAwKjEwLCBtZW1UeXBlPUZsb2F0MzJBcnJheSApIHtcbiAgICB1dGlsaXRpZXMuY2xlYXIoKVxuICAgIGlmKCBkZWJ1ZyA9PT0gdW5kZWZpbmVkICkgZGVidWcgPSBmYWxzZVxuICAgICAgICAgIFxuICAgIHRoaXMuaXNTdGVyZW8gPSBBcnJheS5pc0FycmF5KCBncmFwaCApXG5cbiAgICB1dGlsaXRpZXMuY2FsbGJhY2sgPSBnZW4uY3JlYXRlQ2FsbGJhY2soIGdyYXBoLCBtZW0sIGRlYnVnLCBmYWxzZSwgbWVtVHlwZSApXG4gICAgXG4gICAgaWYoIHV0aWxpdGllcy5jb25zb2xlICkgdXRpbGl0aWVzLmNvbnNvbGUuc2V0VmFsdWUoIHV0aWxpdGllcy5jYWxsYmFjay50b1N0cmluZygpIClcblxuICAgIHJldHVybiB1dGlsaXRpZXMuY2FsbGJhY2tcbiAgfSxcblxuICBsb2FkU2FtcGxlKCBzb3VuZEZpbGVQYXRoLCBkYXRhICkge1xuICAgIGxldCByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgIHJlcS5vcGVuKCAnR0VUJywgc291bmRGaWxlUGF0aCwgdHJ1ZSApXG4gICAgcmVxLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcicgXG4gICAgXG4gICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZSggKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhdWRpb0RhdGEgPSByZXEucmVzcG9uc2VcblxuICAgICAgICB1dGlsaXRpZXMuY3R4LmRlY29kZUF1ZGlvRGF0YSggYXVkaW9EYXRhLCAoYnVmZmVyKSA9PiB7XG4gICAgICAgICAgZGF0YS5idWZmZXIgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoMClcbiAgICAgICAgICByZXNvbHZlKCBkYXRhLmJ1ZmZlciApXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJlcS5zZW5kKClcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxufVxuXG51dGlsaXRpZXMuY2xlYXIuY2FsbGJhY2tzID0gW11cblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsaXRpZXNcbiIsIid1c2Ugc3RyaWN0J1xuXG4vKlxuICogbWFueSB3aW5kb3dzIGhlcmUgYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9jb3JiYW5icm9vay9kc3AuanMvYmxvYi9tYXN0ZXIvZHNwLmpzXG4gKiBzdGFydGluZyBhdCBsaW5lIDE0MjdcbiAqIHRha2VuIDgvMTUvMTZcbiovIFxuXG5jb25zdCB3aW5kb3dzID0gbW9kdWxlLmV4cG9ydHMgPSB7IFxuICBiYXJ0bGV0dCggbGVuZ3RoLCBpbmRleCApIHtcbiAgICByZXR1cm4gMiAvIChsZW5ndGggLSAxKSAqICgobGVuZ3RoIC0gMSkgLyAyIC0gTWF0aC5hYnMoaW5kZXggLSAobGVuZ3RoIC0gMSkgLyAyKSkgXG4gIH0sXG5cbiAgYmFydGxldHRIYW5uKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiAwLjYyIC0gMC40OCAqIE1hdGguYWJzKGluZGV4IC8gKGxlbmd0aCAtIDEpIC0gMC41KSAtIDAuMzggKiBNYXRoLmNvcyggMiAqIE1hdGguUEkgKiBpbmRleCAvIChsZW5ndGggLSAxKSlcbiAgfSxcblxuICBibGFja21hbiggbGVuZ3RoLCBpbmRleCwgYWxwaGEgKSB7XG4gICAgbGV0IGEwID0gKDEgLSBhbHBoYSkgLyAyLFxuICAgICAgICBhMSA9IDAuNSxcbiAgICAgICAgYTIgPSBhbHBoYSAvIDJcblxuICAgIHJldHVybiBhMCAtIGExICogTWF0aC5jb3MoMiAqIE1hdGguUEkgKiBpbmRleCAvIChsZW5ndGggLSAxKSkgKyBhMiAqIE1hdGguY29zKDQgKiBNYXRoLlBJICogaW5kZXggLyAobGVuZ3RoIC0gMSkpXG4gIH0sXG5cbiAgY29zaW5lKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiBNYXRoLmNvcyhNYXRoLlBJICogaW5kZXggLyAobGVuZ3RoIC0gMSkgLSBNYXRoLlBJIC8gMilcbiAgfSxcblxuICBnYXVzcyggbGVuZ3RoLCBpbmRleCwgYWxwaGEgKSB7XG4gICAgcmV0dXJuIE1hdGgucG93KE1hdGguRSwgLTAuNSAqIE1hdGgucG93KChpbmRleCAtIChsZW5ndGggLSAxKSAvIDIpIC8gKGFscGhhICogKGxlbmd0aCAtIDEpIC8gMiksIDIpKVxuICB9LFxuXG4gIGhhbW1pbmcoIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgcmV0dXJuIDAuNTQgLSAwLjQ2ICogTWF0aC5jb3MoIE1hdGguUEkgKiAyICogaW5kZXggLyAobGVuZ3RoIC0gMSkpXG4gIH0sXG5cbiAgaGFubiggbGVuZ3RoLCBpbmRleCApIHtcbiAgICByZXR1cm4gMC41ICogKDEgLSBNYXRoLmNvcyggTWF0aC5QSSAqIDIgKiBpbmRleCAvIChsZW5ndGggLSAxKSkgKVxuICB9LFxuXG4gIGxhbmN6b3MoIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgbGV0IHggPSAyICogaW5kZXggLyAobGVuZ3RoIC0gMSkgLSAxO1xuICAgIHJldHVybiBNYXRoLnNpbihNYXRoLlBJICogeCkgLyAoTWF0aC5QSSAqIHgpXG4gIH0sXG5cbiAgcmVjdGFuZ3VsYXIoIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgcmV0dXJuIDFcbiAgfSxcblxuICB0cmlhbmd1bGFyKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIHJldHVybiAyIC8gbGVuZ3RoICogKGxlbmd0aCAvIDIgLSBNYXRoLmFicyhpbmRleCAtIChsZW5ndGggLSAxKSAvIDIpKVxuICB9LFxuXG4gIC8vIHBhcmFib2xhXG4gIHdlbGNoKCBsZW5ndGgsIF9pbmRleCwgaWdub3JlLCBzaGlmdD0wICkge1xuICAgIC8vd1tuXSA9IDEgLSBNYXRoLnBvdyggKCBuIC0gKCAoTi0xKSAvIDIgKSApIC8gKCggTi0xICkgLyAyICksIDIgKVxuICAgIGNvbnN0IGluZGV4ID0gc2hpZnQgPT09IDAgPyBfaW5kZXggOiAoX2luZGV4ICsgTWF0aC5mbG9vciggc2hpZnQgKiBsZW5ndGggKSkgJSBsZW5ndGhcbiAgICBjb25zdCBuXzFfb3ZlcjIgPSAobGVuZ3RoIC0gMSkgLyAyIFxuXG4gICAgcmV0dXJuIDEgLSBNYXRoLnBvdyggKCBpbmRleCAtIG5fMV9vdmVyMiApIC8gbl8xX292ZXIyLCAyIClcbiAgfSxcbiAgaW52ZXJzZXdlbGNoKCBsZW5ndGgsIF9pbmRleCwgaWdub3JlLCBzaGlmdD0wICkge1xuICAgIC8vd1tuXSA9IDEgLSBNYXRoLnBvdyggKCBuIC0gKCAoTi0xKSAvIDIgKSApIC8gKCggTi0xICkgLyAyICksIDIgKVxuICAgIGxldCBpbmRleCA9IHNoaWZ0ID09PSAwID8gX2luZGV4IDogKF9pbmRleCArIE1hdGguZmxvb3IoIHNoaWZ0ICogbGVuZ3RoICkpICUgbGVuZ3RoXG4gICAgY29uc3Qgbl8xX292ZXIyID0gKGxlbmd0aCAtIDEpIC8gMlxuXG4gICAgcmV0dXJuIE1hdGgucG93KCAoIGluZGV4IC0gbl8xX292ZXIyICkgLyBuXzFfb3ZlcjIsIDIgKVxuICB9LFxuXG4gIHBhcmFib2xhKCBsZW5ndGgsIGluZGV4ICkge1xuICAgIGlmKCBpbmRleCA8PSBsZW5ndGggLyAyICkge1xuICAgICAgcmV0dXJuIHdpbmRvd3MuaW52ZXJzZXdlbGNoKCBsZW5ndGggLyAyLCBpbmRleCApIC0gMVxuICAgIH1lbHNle1xuICAgICAgcmV0dXJuIDEgLSB3aW5kb3dzLmludmVyc2V3ZWxjaCggbGVuZ3RoIC8gMiwgaW5kZXggLSBsZW5ndGggLyAyIClcbiAgICB9XG4gIH0sXG5cbiAgZXhwb25lbnRpYWwoIGxlbmd0aCwgaW5kZXgsIGFscGhhICkge1xuICAgIHJldHVybiBNYXRoLnBvdyggaW5kZXggLyBsZW5ndGgsIGFscGhhIClcbiAgfSxcblxuICBsaW5lYXIoIGxlbmd0aCwgaW5kZXggKSB7XG4gICAgcmV0dXJuIGluZGV4IC8gbGVuZ3RoXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5sZXQgZ2VuICA9IHJlcXVpcmUoJy4vZ2VuLmpzJyksXG4gICAgZmxvb3I9IHJlcXVpcmUoJy4vZmxvb3IuanMnKSxcbiAgICBzdWIgID0gcmVxdWlyZSgnLi9zdWIuanMnKSxcbiAgICBtZW1vID0gcmVxdWlyZSgnLi9tZW1vLmpzJylcblxubGV0IHByb3RvID0ge1xuICBiYXNlbmFtZTond3JhcCcsXG5cbiAgZ2VuKCkge1xuICAgIGxldCBjb2RlLFxuICAgICAgICBpbnB1dHMgPSBnZW4uZ2V0SW5wdXRzKCB0aGlzICksXG4gICAgICAgIHNpZ25hbCA9IGlucHV0c1swXSwgbWluID0gaW5wdXRzWzFdLCBtYXggPSBpbnB1dHNbMl0sXG4gICAgICAgIG91dCwgZGlmZlxuXG4gICAgLy9vdXQgPSBgKCgoJHtpbnB1dHNbMF19IC0gJHt0aGlzLm1pbn0pICUgJHtkaWZmfSAgKyAke2RpZmZ9KSAlICR7ZGlmZn0gKyAke3RoaXMubWlufSlgXG4gICAgLy9jb25zdCBsb25nIG51bVdyYXBzID0gbG9uZygodi1sbykvcmFuZ2UpIC0gKHYgPCBsbyk7XG4gICAgLy9yZXR1cm4gdiAtIHJhbmdlICogZG91YmxlKG51bVdyYXBzKTsgICBcbiAgICBcbiAgICBpZiggdGhpcy5taW4gPT09IDAgKSB7XG4gICAgICBkaWZmID0gbWF4XG4gICAgfWVsc2UgaWYgKCBpc05hTiggbWF4ICkgfHwgaXNOYU4oIG1pbiApICkge1xuICAgICAgZGlmZiA9IGAke21heH0gLSAke21pbn1gXG4gICAgfWVsc2V7XG4gICAgICBkaWZmID0gbWF4IC0gbWluXG4gICAgfVxuXG4gICAgb3V0ID1cbmAgdmFyICR7dGhpcy5uYW1lfSA9ICR7aW5wdXRzWzBdfVxuICBpZiggJHt0aGlzLm5hbWV9IDwgJHt0aGlzLm1pbn0gKSAke3RoaXMubmFtZX0gKz0gJHtkaWZmfVxuICBlbHNlIGlmKCAke3RoaXMubmFtZX0gPiAke3RoaXMubWF4fSApICR7dGhpcy5uYW1lfSAtPSAke2RpZmZ9XG5cbmBcblxuICAgIHJldHVybiBbIHRoaXMubmFtZSwgJyAnICsgb3V0IF1cbiAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoIGluMSwgbWluPTAsIG1heD0xICkgPT4ge1xuICBsZXQgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IFxuICAgIG1pbiwgXG4gICAgbWF4LFxuICAgIHVpZDogICAgZ2VuLmdldFVJRCgpLFxuICAgIGlucHV0czogWyBpbjEsIG1pbiwgbWF4IF0sXG4gIH0pXG4gIFxuICB1Z2VuLm5hbWUgPSBgJHt1Z2VuLmJhc2VuYW1lfSR7dWdlbi51aWR9YFxuXG4gIHJldHVybiB1Z2VuXG59XG4iLCJsZXQgdWdlbiA9IHJlcXVpcmUoICcuLi91Z2VuLmpzJyApXG5cbmxldCBhbmFseXplciA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuXG5PYmplY3QuYXNzaWduKCBhbmFseXplciwge1xuICBfX3R5cGVfXzogJ2FuYWx5emVyJyxcbiAgcHJpb3JpdHk6MFxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBhbmFseXplclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IGFuYWx5emVycyA9IHtcbiAgICBTU0Q6ICAgIHJlcXVpcmUoICcuL3NpbmdsZXNhbXBsZWRlbGF5LmpzJyAgKSggR2liYmVyaXNoICksXG4gICAgRm9sbG93OiByZXF1aXJlKCAnLi9mb2xsb3cuanMnICApKCBHaWJiZXJpc2ggKVxuICB9XG5cbiAgYW5hbHl6ZXJzLmV4cG9ydCA9IHRhcmdldCA9PiB7XG4gICAgZm9yKCBsZXQga2V5IGluIGFuYWx5emVycyApIHtcbiAgICAgIGlmKCBrZXkgIT09ICdleHBvcnQnICkge1xuICAgICAgICB0YXJnZXRbIGtleSBdID0gYW5hbHl6ZXJzWyBrZXkgXVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG5yZXR1cm4gYW5hbHl6ZXJzXG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCdnZW5pc2guanMnKSxcbiAgICAgIGFuYWx5emVyID0gcmVxdWlyZSgnLi9hbmFseXplci5qcycpLFxuICAgICAgdWdlbiA9IHJlcXVpcmUoJy4uL3VnZW4uanMnKTtcblxuY29uc3QgZ2VuaXNoID0gZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoR2liYmVyaXNoKSB7XG5cbiAgY29uc3QgRm9sbG93ID0gaW5wdXRQcm9wcyA9PiB7XG5cbiAgICAvLyBtYWluIGZvbGxvdyBvYmplY3QgaXMgYWxzbyB0aGUgb3V0cHV0XG4gICAgY29uc3QgZm9sbG93ID0gT2JqZWN0LmNyZWF0ZShhbmFseXplcik7XG4gICAgZm9sbG93LmluID0gT2JqZWN0LmNyZWF0ZSh1Z2VuKTtcbiAgICBmb2xsb3cuaWQgPSBHaWJiZXJpc2guZmFjdG9yeS5nZXRVSUQoKTtcblxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgaW5wdXRQcm9wcywgRm9sbG93LmRlZmF1bHRzKTtcbiAgICBsZXQgaXNTdGVyZW8gPSBwcm9wcy5pbnB1dC5pc1N0ZXJlbyAhPT0gdW5kZWZpbmVkID8gcHJvcHMuaW5wdXQuaXNTdGVyZW8gOiB0cnVlO1xuXG4gICAgLy8gdGhlIGlucHV0IHRvIHRoZSBmb2xsb3cgdWdlbiBpcyBidWZmZXJlZCBpbiB0aGlzIHVnZW5cbiAgICBmb2xsb3cuYnVmZmVyID0gZy5kYXRhKHByb3BzLmJ1ZmZlclNpemUsIDEpO1xuXG4gICAgbGV0IGF2ZzsgLy8gb3V0cHV0OyBtYWtlIGF2YWlsYWJsZSBvdXRzaWRlIGpzZHNwIGJsb2NrXG4gICAgY29uc3QgX2lucHV0ID0gZy5pbignaW5wdXQnKTtcbiAgICBjb25zdCBpbnB1dCA9IGlzU3RlcmVvID8gZy5hZGQoX2lucHV0WzBdLCBfaW5wdXRbMV0pIDogX2lucHV0O1xuXG4gICAge1xuICAgICAgXCJ1c2UganNkc3BcIjtcbiAgICAgIC8vIHBoYXNlIHRvIHdyaXRlIHRvIGZvbGxvdyBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZmZlclBoYXNlT3V0ID0gZy5hY2N1bSgxLCAwLCB7IG1heDogcHJvcHMuYnVmZmVyU2l6ZSwgbWluOiAwIH0pO1xuXG4gICAgICAvLyBob2xkIHJ1bm5pbmcgc3VtXG4gICAgICBjb25zdCBzdW0gPSBnLmRhdGEoMSwgMSwgeyBtZXRhOiB0cnVlIH0pO1xuXG4gICAgICBzdW1bMF0gPSBnZW5pc2guc3ViKGdlbmlzaC5hZGQoc3VtWzBdLCBpbnB1dCksIGcucGVlayhmb2xsb3cuYnVmZmVyLCBidWZmZXJQaGFzZU91dCwgeyBtb2RlOiAnc2ltcGxlJyB9KSk7XG5cbiAgICAgIGF2ZyA9IGdlbmlzaC5kaXYoc3VtWzBdLCBwcm9wcy5idWZmZXJTaXplKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzU3RlcmVvKSB7XG4gICAgICBHaWJiZXJpc2guZmFjdG9yeShmb2xsb3csIGF2ZywgJ2ZvbGxvd19vdXQnLCBwcm9wcyk7XG5cbiAgICAgIGZvbGxvdy5jYWxsYmFjay51Z2VuTmFtZSA9IGZvbGxvdy51Z2VuTmFtZSA9IGBmb2xsb3dfb3V0XyR7IGZvbGxvdy5pZCB9YDtcblxuICAgICAgLy8gaGF2ZSB0byB3cml0ZSBjdXN0b20gY2FsbGJhY2sgZm9yIGlucHV0IHRvIHJldXNlIGNvbXBvbmVudHMgZnJvbSBvdXRwdXQsXG4gICAgICAvLyBzcGVjaWZpY2FsbHkgdGhlIG1lbW9yeSBmcm9tIG91ciBidWZmZXJcbiAgICAgIGxldCBpZHggPSBmb2xsb3cuYnVmZmVyLm1lbW9yeS52YWx1ZXMuaWR4O1xuICAgICAgbGV0IHBoYXNlID0gMDtcbiAgICAgIGxldCBhYnMgPSBNYXRoLmFicztcbiAgICAgIGxldCBjYWxsYmFjayA9IGZ1bmN0aW9uIChpbnB1dCwgbWVtb3J5KSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcblxuICAgICAgICBtZW1vcnlbZ2VuaXNoLmFkZChpZHgsIHBoYXNlKV0gPSBhYnMoaW5wdXQpO1xuICAgICAgICBwaGFzZSsrO1xuICAgICAgICBpZiAocGhhc2UgPiBnZW5pc2guc3ViKHByb3BzLmJ1ZmZlclNpemUsIDEpKSB7XG4gICAgICAgICAgcGhhc2UgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9O1xuXG4gICAgICBHaWJiZXJpc2guZmFjdG9yeShmb2xsb3cuaW4sIGlucHV0LCAnZm9sbG93X2luJywgcHJvcHMsIGNhbGxiYWNrKTtcblxuICAgICAgLy8gbG90cyBvZiBub25zZW5zZSB0byBtYWtlIG91ciBjdXN0b20gZnVuY3Rpb24gd29ya1xuICAgICAgZm9sbG93LmluLmNhbGxiYWNrLnVnZW5OYW1lID0gZm9sbG93LmluLnVnZW5OYW1lID0gYGZvbGxvd19pbl8keyBmb2xsb3cuaWQgfWA7XG4gICAgICBmb2xsb3cuaW4uaW5wdXROYW1lcyA9IFsnaW5wdXQnXTtcbiAgICAgIGZvbGxvdy5pbi5pbnB1dHMgPSBbaW5wdXRdO1xuICAgICAgZm9sbG93LmluLmlucHV0ID0gcHJvcHMuaW5wdXQ7XG4gICAgICBmb2xsb3cuaW4udHlwZSA9ICdhbmFseXNpcyc7XG5cbiAgICAgIGlmIChHaWJiZXJpc2guYW5hbHl6ZXJzLmluZGV4T2YoZm9sbG93LmluKSA9PT0gLTEpIHtcbiAgICAgICAgR2liYmVyaXNoLmFuYWx5emVycy5wdXNoKGZvbGxvdy5pbik7XG4gICAgICB9XG5cbiAgICAgIEdpYmJlcmlzaC5kaXJ0eShHaWJiZXJpc2guYW5hbHl6ZXJzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm9sbG93O1xuICB9O1xuXG4gIEZvbGxvdy5kZWZhdWx0cyA9IHtcbiAgICBidWZmZXJTaXplOiA4MTkyXG4gIH07XG5cbiAgcmV0dXJuIEZvbGxvdztcbn07IiwiY29uc3QgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgICBhbmFseXplciA9IHJlcXVpcmUoICcuL2FuYWx5emVyLmpzJyApLFxuICAgICAgcHJveHkgICAgPSByZXF1aXJlKCAnLi4vd29ya2xldFByb3h5LmpzJyApLFxuICAgICAgdWdlbiAgICAgPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gXG5jb25zdCBEZWxheSA9IGlucHV0UHJvcHMgPT4ge1xuICBsZXQgc3NkID0gT2JqZWN0LmNyZWF0ZSggYW5hbHl6ZXIgKVxuICBzc2QuX19pbiAgPSBPYmplY3QuY3JlYXRlKCB1Z2VuIClcbiAgc3NkLl9fb3V0ID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG5cbiAgc3NkLmlkID0gR2liYmVyaXNoLmZhY3RvcnkuZ2V0VUlEKClcblxuICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBEZWxheS5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gIGxldCBpc1N0ZXJlbyA9IHByb3BzLmlzU3RlcmVvIFxuICBcbiAgbGV0IGlucHV0ID0gZy5pbiggJ2lucHV0JyApXG4gICAgXG4gIGxldCBoaXN0b3J5TCA9IGcuaGlzdG9yeSgpXG5cbiAgaWYoIGlzU3RlcmVvICkge1xuICAgIC8vIHJpZ2h0IGNoYW5uZWxcbiAgICBsZXQgaGlzdG9yeVIgPSBnLmhpc3RvcnkoKVxuXG4gICAgR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgICAgc3NkLl9fb3V0LFxuICAgICAgWyBoaXN0b3J5TC5vdXQsIGhpc3RvcnlSLm91dCBdLCBcbiAgICAgICdzc2Rfb3V0JywgXG4gICAgICBwcm9wcyxcbiAgICAgIG51bGwsXG4gICAgICBmYWxzZVxuICAgIClcblxuICAgIHNzZC5fX291dC5jYWxsYmFjay51Z2VuTmFtZSA9IHNzZC5fX291dC51Z2VuTmFtZSA9ICdzc2Rfb3V0JyArIHNzZC5pZFxuXG4gICAgY29uc3QgaWR4TCA9IHNzZC5fX291dC5ncmFwaC5tZW1vcnkudmFsdWUuaWR4LCBcbiAgICAgICAgICBpZHhSID0gaWR4TCArIDEsXG4gICAgICAgICAgbWVtb3J5ID0gR2liYmVyaXNoLmdlbmlzaC5nZW4ubWVtb3J5LmhlYXBcblxuICAgIGNvbnN0IGNhbGxiYWNrID0gZnVuY3Rpb24oIGlucHV0ICkge1xuICAgICAgJ3VzZSBzdHJpY3QnXG4gICAgICBtZW1vcnlbIGlkeEwgXSA9IGlucHV0WzBdXG4gICAgICBtZW1vcnlbIGlkeFIgXSA9IGlucHV0WzFdXG4gICAgICByZXR1cm4gMCAgICAgXG4gICAgfVxuICAgIFxuICAgIEdpYmJlcmlzaC5mYWN0b3J5KCBzc2QuaW4sIFsgaW5wdXRbMF0saW5wdXRbMV0gXSwgJ3NzZF9pbicsIHByb3BzLCBjYWxsYmFjaywgZmFsc2UgKVxuXG4gICAgY2FsbGJhY2sudWdlbk5hbWUgPSBzc2QuaW4udWdlbk5hbWUgPSAnc3NkX2luXycgKyBzc2QuaWRcbiAgICBzc2QuaW4uaW5wdXROYW1lcyA9IFsgJ2lucHV0JyBdXG4gICAgc3NkLmluLmlucHV0cyA9IFsgcHJvcHMuaW5wdXQgXVxuICAgIHNzZC5pbi5pbnB1dCA9IHByb3BzLmlucHV0XG4gICAgc3NkLnR5cGUgPSAnYW5hbHlzaXMnXG5cbiAgICBzc2QuaW4ubGlzdGVuID0gZnVuY3Rpb24oIHVnZW4gKSB7XG4gICAgICBpZiggdWdlbiAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICBzc2QuaW4uaW5wdXQgPSB1Z2VuXG4gICAgICAgIHNzZC5pbi5pbnB1dHMgPSBbIHVnZW4gXVxuICAgICAgfVxuXG4gICAgICBpZiggR2liYmVyaXNoLmFuYWx5emVycy5pbmRleE9mKCBzc2QuaW4gKSA9PT0gLTEgKSB7XG4gICAgICAgIEdpYmJlcmlzaC5hbmFseXplcnMucHVzaCggc3NkLmluIClcbiAgICAgIH1cblxuICAgICAgR2liYmVyaXNoLmRpcnR5KCBHaWJiZXJpc2guYW5hbHl6ZXJzIClcbiAgICB9XG4gIH1lbHNle1xuICAgIEdpYmJlcmlzaC5mYWN0b3J5KCBzc2QuX19vdXQsIGhpc3RvcnlMLm91dCwgJ3NzZF9vdXQnLCBwcm9wcywgbnVsbCwgZmFsc2UgKVxuXG4gICAgc3NkLl9fb3V0LmNhbGxiYWNrLnVnZW5OYW1lID0gc3NkLl9fb3V0LnVnZW5OYW1lID0gJ3NzZF9vdXQnICsgc3NkLmlkXG5cbiAgICBsZXQgaWR4ID0gc3NkLl9fb3V0LmdyYXBoLm1lbW9yeS52YWx1ZS5pZHggXG4gICAgbGV0IG1lbW9yeSA9IEdpYmJlcmlzaC5nZW5pc2guZ2VuLm1lbW9yeS5oZWFwXG4gICAgbGV0IGNhbGxiYWNrID0gZnVuY3Rpb24oIGlucHV0ICkge1xuICAgICAgJ3VzZSBzdHJpY3QnXG4gICAgICBtZW1vcnlbIGlkeCBdID0gaW5wdXRcbiAgICAgIHJldHVybiAwICAgICBcbiAgICB9XG4gICAgXG4gICAgR2liYmVyaXNoLmZhY3RvcnkoIHNzZC5fX2luLCBpbnB1dCwgJ3NzZF9pbicsIHt9LCBjYWxsYmFjaywgZmFsc2UgKVxuXG4gICAgY2FsbGJhY2sudWdlbk5hbWUgPSBzc2QuX19pbi51Z2VuTmFtZSA9ICdzc2RfaW5fJyArIHNzZC5pZFxuICAgIHNzZC5fX2luLmlucHV0TmFtZXMgPSBbICdpbnB1dCcgXVxuICAgIHNzZC5fX2luLmlucHV0cyA9IFsgcHJvcHMuaW5wdXQgXVxuICAgIHNzZC5fX2luLmlucHV0ID0gcHJvcHMuaW5wdXRcbiAgICBzc2QudHlwZSA9ICdhbmFseXNpcydcblxuICAgIHNzZC5fX2luLmxpc3RlbiA9IGZ1bmN0aW9uKCB1Z2VuICkge1xuICAgICAgLy9jb25zb2xlLmxvZyggJ2xpc3RlbmluZzonLCB1Z2VuLCBHaWJiZXJpc2gubW9kZSApXG4gICAgICBpZiggdWdlbiAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICBzc2QuX19pbi5pbnB1dCA9IHVnZW5cbiAgICAgICAgc3NkLl9faW4uaW5wdXRzID0gWyB1Z2VuIF1cbiAgICAgIH1cblxuICAgICAgaWYoIEdpYmJlcmlzaC5hbmFseXplcnMuaW5kZXhPZiggc3NkLl9faW4gKSA9PT0gLTEgKSB7XG4gICAgICAgIGlmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3dvcmtsZXQnICkge1xuICAgICAgICAgIEdpYmJlcmlzaC5hbmFseXplcnMucHVzaCggeyBpZDpzc2QuaWQsIHByb3A6J2luJyB9KVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBHaWJiZXJpc2guYW5hbHl6ZXJzLnB1c2goIHNzZC5fX2luIClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBHaWJiZXJpc2guZGlydHkoIEdpYmJlcmlzaC5hbmFseXplcnMgKVxuICAgICAgLy9jb25zb2xlLmxvZyggJ2luOicsIHNzZC5fX2luIClcbiAgICB9XG5cbiAgfVxuXG4gIHNzZC5saXN0ZW4gPSBzc2QuX19pbi5saXN0ZW5cbiAgc3NkLl9faW4udHlwZSA9ICdhbmFseXNpcydcblxuIFxuICBzc2QuX19vdXQuaW5wdXRzID0gW11cblxuICBjb25zdCBvdXQgPSAgcHJveHkoIFsnYW5hbHlzaXMnLCdTU0QnXSwgcHJvcHMsIHNzZCApXG4gIFxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyggb3V0LCB7XG4gICAgJ291dCc6IHtcbiAgICAgIHNldCh2KSB7fSxcbiAgICAgIGdldCgpIHtcbiAgICAgICAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgICAgICAgcmV0dXJuIHsgaWQ6b3V0LmlkLCBwcm9wOidvdXQnIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcmV0dXJuIG91dC5fX291dFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICAvLydpbic6IHtcbiAgICAvLyAgc2V0KHYpIHt9LFxuICAgIC8vICBnZXQoKSB7XG4gICAgLy8gICAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgLy8gICAgICBjb25zb2xlLmxvZyggJ3JldHVybmluZyBzc2QgaW4nIClcbiAgICAvLyAgICAgIHJldHVybiB7IGlkOm91dC5pZCwgcHJvcDonaW4nIH1cbiAgICAvLyAgICB9ZWxzZXtcbiAgICAvLyAgICAgIHJldHVybiBvdXQuX19pblxuICAgIC8vICAgIH1cbiAgICAvLyAgfVxuICAgIC8vfSxcblxuICB9KVxuXG4gIHJldHVybiBvdXRcbn1cblxuRGVsYXkuZGVmYXVsdHMgPSB7XG4gIGlucHV0OjAsXG4gIGlzU3RlcmVvOmZhbHNlXG59XG5cbnJldHVybiBEZWxheVxuXG59XG4iLCJjb25zdCB1Z2VuID0gcmVxdWlyZSggJy4uL3VnZW4uanMnICksXG4gICAgICBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbiAgY29uc3QgQUQgPSBmdW5jdGlvbiggYXJndW1lbnRQcm9wcyApIHtcbiAgICBjb25zdCBhZCA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKSxcbiAgICAgICAgICBhdHRhY2sgID0gZy5pbiggJ2F0dGFjaycgKSxcbiAgICAgICAgICBkZWNheSAgID0gZy5pbiggJ2RlY2F5JyApXG5cbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oIHt9LCBBRC5kZWZhdWx0cywgYXJndW1lbnRQcm9wcyApXG5cbiAgICBjb25zdCBncmFwaCA9IGcuYWQoIGF0dGFjaywgZGVjYXksIHsgc2hhcGU6cHJvcHMuc2hhcGUsIGFscGhhOnByb3BzLmFscGhhIH0pXG5cbiAgICBhZC50cmlnZ2VyID0gZ3JhcGgudHJpZ2dlclxuICAgIFxuICAgIGNvbnN0IF9fb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIGFkLCBncmFwaCwgWydlbnZlbG9wZXMnLCdBRCddLCBwcm9wcyApXG5cbiAgICByZXR1cm4gX19vdXRcbiAgfVxuXG4gIEFELmRlZmF1bHRzID0geyBhdHRhY2s6NDQxMDAsIGRlY2F5OjQ0MTAwLCBzaGFwZTonZXhwb25lbnRpYWwnLCBhbHBoYTo1IH0gXG5cbiAgcmV0dXJuIEFEXG5cbn1cbiIsImNvbnN0IHVnZW4gPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKSxcbiAgICAgIGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuICBjb25zdCBBRFNSID0gZnVuY3Rpb24oIGFyZ3VtZW50UHJvcHMgKSB7XG4gICAgY29uc3QgYWRzciAgPSBPYmplY3QuY3JlYXRlKCB1Z2VuICksXG4gICAgICAgICAgYXR0YWNrICA9IGcuaW4oICdhdHRhY2snICksXG4gICAgICAgICAgZGVjYXkgICA9IGcuaW4oICdkZWNheScgKSxcbiAgICAgICAgICBzdXN0YWluID0gZy5pbiggJ3N1c3RhaW4nICksXG4gICAgICAgICAgcmVsZWFzZSA9IGcuaW4oICdyZWxlYXNlJyApLFxuICAgICAgICAgIHN1c3RhaW5MZXZlbCA9IGcuaW4oICdzdXN0YWluTGV2ZWwnIClcblxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbigge30sIEFEU1IuZGVmYXVsdHMsIGFyZ3VtZW50UHJvcHMgKVxuXG4gICAgT2JqZWN0LmFzc2lnbiggYWRzciwgcHJvcHMgKVxuXG4gICAgY29uc3QgZ3JhcGggPSBnLmFkc3IoIFxuICAgICAgYXR0YWNrLCBkZWNheSwgc3VzdGFpbiwgc3VzdGFpbkxldmVsLCByZWxlYXNlLCBcbiAgICAgIHsgdHJpZ2dlclJlbGVhc2U6IHByb3BzLnRyaWdnZXJSZWxlYXNlLCBzaGFwZTpwcm9wcy5zaGFwZSwgYWxwaGE6cHJvcHMuYWxwaGEgfSBcbiAgICApXG5cbiAgICBhZHNyLnRyaWdnZXIgPSBncmFwaC50cmlnZ2VyXG4gICAgYWRzci5hZHZhbmNlID0gZ3JhcGgucmVsZWFzZVxuXG4gICAgY29uc3QgX19vdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggYWRzciwgZ3JhcGgsIFsnZW52ZWxvcGVzJywnQURTUiddLCBwcm9wcyApXG5cbiAgICByZXR1cm4gX19vdXQgXG4gIH1cblxuICBBRFNSLmRlZmF1bHRzID0geyBcbiAgICBhdHRhY2s6MjIwNTAsIFxuICAgIGRlY2F5OjIyMDUwLCBcbiAgICBzdXN0YWluOjQ0MTAwLCBcbiAgICBzdXN0YWluTGV2ZWw6LjYsIFxuICAgIHJlbGVhc2U6IDQ0MTAwLCBcbiAgICB0cmlnZ2VyUmVsZWFzZTpmYWxzZSxcbiAgICBzaGFwZTonZXhwb25lbnRpYWwnLFxuICAgIGFscGhhOjUgXG4gIH0gXG5cbiAgcmV0dXJuIEFEU1Jcbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuICBjb25zdCBFbnZlbG9wZXMgPSB7XG4gICAgQUQgICAgIDogcmVxdWlyZSggJy4vYWQuanMnICkoIEdpYmJlcmlzaCApLFxuICAgIEFEU1IgICA6IHJlcXVpcmUoICcuL2Fkc3IuanMnICkoIEdpYmJlcmlzaCApLFxuICAgIFJhbXAgICA6IHJlcXVpcmUoICcuL3JhbXAuanMnICkoIEdpYmJlcmlzaCApLFxuXG4gICAgZXhwb3J0IDogdGFyZ2V0ID0+IHtcbiAgICAgIGZvciggbGV0IGtleSBpbiBFbnZlbG9wZXMgKSB7XG4gICAgICAgIGlmKCBrZXkgIT09ICdleHBvcnQnICYmIGtleSAhPT0gJ2ZhY3RvcnknICkge1xuICAgICAgICAgIHRhcmdldFsga2V5IF0gPSBFbnZlbG9wZXNbIGtleSBdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZmFjdG9yeSggdXNlQURTUiwgc2hhcGUsIGF0dGFjaywgZGVjYXksIHN1c3RhaW4sIHN1c3RhaW5MZXZlbCwgcmVsZWFzZSwgdHJpZ2dlclJlbGVhc2U9ZmFsc2UgKSB7XG4gICAgICBsZXQgZW52XG5cbiAgICAgIC8vIGRlbGliZXJhdGUgdXNlIG9mIHNpbmdsZSA9IHRvIGFjY29tb2RhdGUgYm90aCAxIGFuZCB0cnVlXG4gICAgICBpZiggdXNlQURTUiAhPSB0cnVlICkge1xuICAgICAgICBlbnYgPSBnLmFkKCBhdHRhY2ssIGRlY2F5LCB7IHNoYXBlIH0pIFxuICAgICAgfWVsc2Uge1xuICAgICAgICBlbnYgPSBnLmFkc3IoIGF0dGFjaywgZGVjYXksIHN1c3RhaW4sIHN1c3RhaW5MZXZlbCwgcmVsZWFzZSwgeyBzaGFwZSwgdHJpZ2dlclJlbGVhc2UgfSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGVudlxuICAgIH1cbiAgfSBcblxuICByZXR1cm4gRW52ZWxvcGVzXG59XG4iLCJjb25zdCB1Z2VuID0gcmVxdWlyZSggJy4uL3VnZW4uanMnICksXG4gICAgICBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbiAgY29uc3QgUmFtcCA9IGZ1bmN0aW9uKCBhcmd1bWVudFByb3BzICkge1xuICAgIGNvbnN0IHJhbXAgICA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKSxcbiAgICAgICAgICBsZW5ndGggPSBnLmluKCAnbGVuZ3RoJyApLFxuICAgICAgICAgIGZyb20gICA9IGcuaW4oICdmcm9tJyApLFxuICAgICAgICAgIHRvICAgICA9IGcuaW4oICd0bycgKVxuXG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBSYW1wLmRlZmF1bHRzLCBhcmd1bWVudFByb3BzIClcblxuICAgIGNvbnN0IHJlc2V0ID0gZy5iYW5nKClcblxuICAgIGNvbnN0IHBoYXNlID0gZy5hY2N1bSggZy5kaXYoIDEsIGxlbmd0aCApLCByZXNldCwgeyBzaG91bGRXcmFwOnByb3BzLnNob3VsZExvb3AsIHNob3VsZENsYW1wOnRydWUgfSksXG4gICAgICAgICAgZGlmZiA9IGcuc3ViKCB0bywgZnJvbSApLFxuICAgICAgICAgIGdyYXBoID0gZy5hZGQoIGZyb20sIGcubXVsKCBwaGFzZSwgZGlmZiApIClcbiAgICAgICAgXG4gICAgcmFtcC50cmlnZ2VyID0gcmVzZXQudHJpZ2dlclxuXG4gICAgY29uc3Qgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIHJhbXAsIGdyYXBoLCBbJ2VudmVsb3BlcycsJ3JhbXAnXSwgcHJvcHMgKVxuXG5cbiAgICByZXR1cm4gb3V0XG4gIH1cblxuICBSYW1wLmRlZmF1bHRzID0geyBmcm9tOjAsIHRvOjEsIGxlbmd0aDpnLmdlbi5zYW1wbGVyYXRlLCBzaG91bGRMb29wOmZhbHNlIH1cblxuICByZXR1cm4gUmFtcFxuXG59XG4iLCIvKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2FudGltYXR0ZXIxNS9oZWFwcXVldWUuanMvYmxvYi9tYXN0ZXIvaGVhcHF1ZXVlLmpzXG4gKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyB2ZXJ5IGxvb3NlbHkgYmFzZWQgb2ZmIGpzLXByaW9yaXR5LXF1ZXVlXG4gKiBieSBBZGFtIEhvb3BlciBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9hZGFtaG9vcGVyL2pzLXByaW9yaXR5LXF1ZXVlXG4gKlxuICogVGhlIGpzLXByaW9yaXR5LXF1ZXVlIGltcGxlbWVudGF0aW9uIHNlZW1lZCBhIHRlZW5zeSBiaXQgYmxvYXRlZFxuICogd2l0aCBpdHMgcmVxdWlyZS5qcyBkZXBlbmRlbmN5IGFuZCBtdWx0aXBsZSBzdG9yYWdlIHN0cmF0ZWdpZXNcbiAqIHdoZW4gYWxsIGJ1dCBvbmUgd2VyZSBzdHJvbmdseSBkaXNjb3VyYWdlZC4gU28gaGVyZSBpcyBhIGtpbmQgb2ZcbiAqIGNvbmRlbnNlZCB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbmFsaXR5IHdpdGggb25seSB0aGUgZmVhdHVyZXMgdGhhdFxuICogSSBwYXJ0aWN1bGFybHkgbmVlZGVkLlxuICpcbiAqIFVzaW5nIGl0IGlzIHByZXR0eSBzaW1wbGUsIHlvdSBqdXN0IGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBIZWFwUXVldWVcbiAqIHdoaWxlIG9wdGlvbmFsbHkgc3BlY2lmeWluZyBhIGNvbXBhcmF0b3IgYXMgdGhlIGFyZ3VtZW50OlxuICpcbiAqIHZhciBoZWFwcSA9IG5ldyBIZWFwUXVldWUoKTtcbiAqXG4gKiAvL0lGIE5FR0FUSVZFLCBSRVRVUk4gQVxuICpcbiAqIHZhciBjdXN0b21xID0gbmV3IEhlYXBRdWV1ZShmdW5jdGlvbihhLCBiKXtcbiAqICAgLy8gaWYgYiA+IGEsIHJldHVybiBuZWdhdGl2ZVxuICogICAvLyBtZWFucyB0aGF0IGl0IHNwaXRzIG91dCB0aGUgc21hbGxlc3QgaXRlbSBmaXJzdFxuICogICByZXR1cm4gYSAtIGI7XG4gKiB9KTtcbiAqXG4gKiBOb3RlIHRoYXQgaW4gdGhpcyBjYXNlLCB0aGUgZGVmYXVsdCBjb21wYXJhdG9yIGlzIGlkZW50aWNhbCB0b1xuICogdGhlIGNvbXBhcmF0b3Igd2hpY2ggaXMgdXNlZCBleHBsaWNpdGx5IGluIHRoZSBzZWNvbmQgcXVldWUuXG4gKlxuICogT25jZSB5b3UndmUgaW5pdGlhbGl6ZWQgdGhlIGhlYXBxdWV1ZSwgeW91IGNhbiBwbG9wIHNvbWUgbmV3XG4gKiBlbGVtZW50cyBpbnRvIHRoZSBxdWV1ZSB3aXRoIHRoZSBwdXNoIG1ldGhvZCAodmFndWVseSByZW1pbmlzY2VudFxuICogb2YgdHlwaWNhbCBqYXZhc2NyaXB0IGFyYXlzKVxuICpcbiAqIGhlYXBxLnB1c2goNDIpO1xuICogaGVhcHEucHVzaChcImtpdHRlblwiKTtcbiAqXG4gKiBUaGUgcHVzaCBtZXRob2QgcmV0dXJucyB0aGUgbmV3IG51bWJlciBvZiBlbGVtZW50cyBvZiB0aGUgcXVldWUuXG4gKlxuICogWW91IGNhbiBwdXNoIGFueXRoaW5nIHlvdSdkIGxpa2Ugb250byB0aGUgcXVldWUsIHNvIGxvbmcgYXMgeW91clxuICogY29tcGFyYXRvciBmdW5jdGlvbiBpcyBjYXBhYmxlIG9mIGhhbmRsaW5nIGl0LiBUaGUgZGVmYXVsdFxuICogY29tcGFyYXRvciBpcyByZWFsbHkgc3R1cGlkIHNvIGl0IHdvbid0IGJlIGFibGUgdG8gaGFuZGxlIGFueXRoaW5nXG4gKiBvdGhlciB0aGFuIGFuIG51bWJlciBieSBkZWZhdWx0LlxuICpcbiAqIFlvdSBjYW4gcHJldmlldyB0aGUgc21hbGxlc3QgaXRlbSBieSB1c2luZyBwZWVrLlxuICpcbiAqIGhlYXBxLnB1c2goLTk5OTkpO1xuICogaGVhcHEucGVlaygpOyAvLyA9PT4gLTk5OTlcbiAqXG4gKiBUaGUgdXNlZnVsIGNvbXBsZW1lbnQgdG8gdG8gdGhlIHB1c2ggbWV0aG9kIGlzIHRoZSBwb3AgbWV0aG9kLFxuICogd2hpY2ggcmV0dXJucyB0aGUgc21hbGxlc3QgaXRlbSBhbmQgdGhlbiByZW1vdmVzIGl0IGZyb20gdGhlXG4gKiBxdWV1ZS5cbiAqXG4gKiBoZWFwcS5wdXNoKDEpO1xuICogaGVhcHEucHVzaCgyKTtcbiAqIGhlYXBxLnB1c2goMyk7XG4gKiBoZWFwcS5wb3AoKTsgLy8gPT0+IDFcbiAqIGhlYXBxLnBvcCgpOyAvLyA9PT4gMlxuICogaGVhcHEucG9wKCk7IC8vID09PiAzXG4gKi9cbmNvbnN0IEhlYXBRdWV1ZSA9IGZ1bmN0aW9uKGNtcCl7XG4gIHRoaXMuY21wID0gKGNtcCB8fCBmdW5jdGlvbihhLCBiKXsgcmV0dXJuIGEgLSBiOyB9KTtcbiAgdGhpcy5sZW5ndGggPSAwO1xuICB0aGlzLmRhdGEgPSBbXTtcbn1cbkhlYXBRdWV1ZS5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiB0aGlzLmRhdGFbMF07XG59O1xuSGVhcFF1ZXVlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24odmFsdWUpe1xuICB0aGlzLmRhdGEucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIHBvcyA9IHRoaXMuZGF0YS5sZW5ndGggLSAxLFxuICBwYXJlbnQsIHg7XG5cbiAgd2hpbGUocG9zID4gMCl7XG4gICAgcGFyZW50ID0gKHBvcyAtIDEpID4+PiAxO1xuICAgIGlmKHRoaXMuY21wKHRoaXMuZGF0YVtwb3NdLCB0aGlzLmRhdGFbcGFyZW50XSkgPCAwKXtcbiAgICAgIHggPSB0aGlzLmRhdGFbcGFyZW50XTtcbiAgICAgIHRoaXMuZGF0YVtwYXJlbnRdID0gdGhpcy5kYXRhW3Bvc107XG4gICAgICB0aGlzLmRhdGFbcG9zXSA9IHg7XG4gICAgICBwb3MgPSBwYXJlbnQ7XG4gICAgfWVsc2UgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIHRoaXMubGVuZ3RoKys7XG59O1xuSGVhcFF1ZXVlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpe1xuICB2YXIgbGFzdF92YWwgPSB0aGlzLmRhdGEucG9wKCksXG4gIHJldCA9IHRoaXMuZGF0YVswXTtcbiAgaWYodGhpcy5kYXRhLmxlbmd0aCA+IDApe1xuICAgIHRoaXMuZGF0YVswXSA9IGxhc3RfdmFsO1xuICAgIHZhciBwb3MgPSAwLFxuICAgIGxhc3QgPSB0aGlzLmRhdGEubGVuZ3RoIC0gMSxcbiAgICBsZWZ0LCByaWdodCwgbWluSW5kZXgsIHg7XG4gICAgd2hpbGUoMSl7XG4gICAgICBsZWZ0ID0gKHBvcyA8PCAxKSArIDE7XG4gICAgICByaWdodCA9IGxlZnQgKyAxO1xuICAgICAgbWluSW5kZXggPSBwb3M7XG4gICAgICBpZihsZWZ0IDw9IGxhc3QgJiYgdGhpcy5jbXAodGhpcy5kYXRhW2xlZnRdLCB0aGlzLmRhdGFbbWluSW5kZXhdKSA8IDApIG1pbkluZGV4ID0gbGVmdDtcbiAgICAgIGlmKHJpZ2h0IDw9IGxhc3QgJiYgdGhpcy5jbXAodGhpcy5kYXRhW3JpZ2h0XSwgdGhpcy5kYXRhW21pbkluZGV4XSkgPCAwKSBtaW5JbmRleCA9IHJpZ2h0O1xuICAgICAgaWYobWluSW5kZXggIT09IHBvcyl7XG4gICAgICAgIHggPSB0aGlzLmRhdGFbbWluSW5kZXhdO1xuICAgICAgICB0aGlzLmRhdGFbbWluSW5kZXhdID0gdGhpcy5kYXRhW3Bvc107XG4gICAgICAgIHRoaXMuZGF0YVtwb3NdID0geDtcbiAgICAgICAgcG9zID0gbWluSW5kZXg7XG4gICAgICB9ZWxzZSBicmVhaztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0ID0gbGFzdF92YWw7XG4gIH1cbiAgdGhpcy5sZW5ndGgtLTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGVhcFF1ZXVlXG4iLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnIClcbiBcbi8vIGNvbnN0cnVjdG9yIGZvciBzY2hyb2VkZXIgYWxscGFzcyBmaWx0ZXJzXG5sZXQgYWxsUGFzcyA9IGZ1bmN0aW9uKCBfaW5wdXQsIGxlbmd0aD01MDAsIGZlZWRiYWNrPS41ICkge1xuICBsZXQgaW5kZXggID0gZy5jb3VudGVyKCAxLDAsbGVuZ3RoICksXG4gICAgICBidWZmZXIgPSBnLmRhdGEoIGxlbmd0aCApLFxuICAgICAgYnVmZmVyU2FtcGxlID0gZy5wZWVrKCBidWZmZXIsIGluZGV4LCB7IGludGVycDonbm9uZScsIG1vZGU6J3NhbXBsZXMnIH0pLFxuICAgICAgb3V0ID0gZy5tZW1vKCBnLmFkZCggZy5tdWwoIC0xLCBfaW5wdXQpLCBidWZmZXJTYW1wbGUgKSApXG4gICAgICAgICAgICAgICAgXG4gIGcucG9rZSggYnVmZmVyLCBnLmFkZCggX2lucHV0LCBnLm11bCggYnVmZmVyU2FtcGxlLCBmZWVkYmFjayApICksIGluZGV4IClcbiBcbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFsbFBhc3NcbiIsImxldCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICBmaWx0ZXIgPSByZXF1aXJlKCAnLi9maWx0ZXIuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIEdpYmJlcmlzaC5nZW5pc2guYmlxdWFkID0gKCBpbnB1dCwgY3V0b2ZmLCBfUSwgbW9kZSwgaXNTdGVyZW8gKSA9PiB7XG4gICAgbGV0IGEwLGExLGEyLGMsYjEsYjIsXG4gICAgICAgIGluMWEwLHgxYTEseDJhMix5MWIxLHkyYjIsXG4gICAgICAgIGluMWEwXzEseDFhMV8xLHgyYTJfMSx5MWIxXzEseTJiMl8xXG5cbiAgICBsZXQgcmV0dXJuVmFsdWVcbiAgICBcbiAgICBjb25zdCBRID0gZy5tZW1vKCBnLmFkZCggLjUsIGcubXVsKCBfUSwgMjIgKSApIClcbiAgICBsZXQgeDEgPSBnLmhpc3RvcnkoKSwgeDIgPSBnLmhpc3RvcnkoKSwgeTEgPSBnLmhpc3RvcnkoKSwgeTIgPSBnLmhpc3RvcnkoKVxuICAgIFxuICAgIGxldCB3MCA9IGcubWVtbyggZy5tdWwoIDIgKiBNYXRoLlBJLCBnLmRpdiggY3V0b2ZmLCAgZy5nZW4uc2FtcGxlcmF0ZSApICkgKSxcbiAgICAgICAgc2ludzAgPSBnLnNpbiggdzAgKSxcbiAgICAgICAgY29zdzAgPSBnLmNvcyggdzAgKSxcbiAgICAgICAgYWxwaGEgPSBnLm1lbW8oIGcuZGl2KCBzaW53MCwgZy5tdWwoIDIsIFEgKSApIClcblxuICAgIGxldCBvbmVNaW51c0Nvc1cgPSBnLnN1YiggMSwgY29zdzAgKVxuXG4gICAgc3dpdGNoKCBtb2RlICkge1xuICAgICAgY2FzZSAxOlxuICAgICAgICBhMCA9IGcubWVtbyggZy5kaXYoIGcuYWRkKCAxLCBjb3N3MCkgLCAyKSApXG4gICAgICAgIGExID0gZy5tdWwoIGcuYWRkKCAxLCBjb3N3MCApLCAtMSApXG4gICAgICAgIGEyID0gYTBcbiAgICAgICAgYyAgPSBnLmFkZCggMSwgYWxwaGEgKVxuICAgICAgICBiMSA9IGcubXVsKCAtMiAsIGNvc3cwIClcbiAgICAgICAgYjIgPSBnLnN1YiggMSwgYWxwaGEgKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgYTAgPSBnLm11bCggUSwgYWxwaGEgKVxuICAgICAgICBhMSA9IDBcbiAgICAgICAgYTIgPSBnLm11bCggYTAsIC0xIClcbiAgICAgICAgYyAgPSBnLmFkZCggMSwgYWxwaGEgKVxuICAgICAgICBiMSA9IGcubXVsKCAtMiAsIGNvc3cwIClcbiAgICAgICAgYjIgPSBnLnN1YiggMSwgYWxwaGEgKVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6IC8vIExQXG4gICAgICAgIGEwID0gZy5tZW1vKCBnLmRpdiggb25lTWludXNDb3NXLCAyKSApXG4gICAgICAgIGExID0gb25lTWludXNDb3NXXG4gICAgICAgIGEyID0gYTBcbiAgICAgICAgYyAgPSBnLmFkZCggMSwgYWxwaGEgKVxuICAgICAgICBiMSA9IGcubXVsKCAtMiAsIGNvc3cwIClcbiAgICAgICAgYjIgPSBnLnN1YiggMSwgYWxwaGEgKVxuICAgIH1cblxuICAgIGEwID0gZy5kaXYoIGEwLCBjICk7IGExID0gZy5kaXYoIGExLCBjICk7IGEyID0gZy5kaXYoIGEyLCBjIClcbiAgICBiMSA9IGcuZGl2KCBiMSwgYyApOyBiMiA9IGcuZGl2KCBiMiwgYyApXG5cbiAgICBpbjFhMCA9IGcubXVsKCB4MS5pbiggaXNTdGVyZW8gPyBpbnB1dFswXSA6IGlucHV0ICksIGEwIClcbiAgICB4MWExICA9IGcubXVsKCB4Mi5pbiggeDEub3V0ICksIGExIClcbiAgICB4MmEyICA9IGcubXVsKCB4Mi5vdXQsICAgICAgICAgIGEyIClcblxuICAgIGxldCBzdW1MZWZ0ID0gZy5hZGQoIGluMWEwLCB4MWExLCB4MmEyIClcblxuICAgIHkxYjEgPSBnLm11bCggeTIuaW4oIHkxLm91dCApLCBiMSApXG4gICAgeTJiMiA9IGcubXVsKCB5Mi5vdXQsIGIyIClcblxuICAgIGxldCBzdW1SaWdodCA9IGcuYWRkKCB5MWIxLCB5MmIyIClcblxuICAgIGxldCBkaWZmID0gZy5zdWIoIHN1bUxlZnQsIHN1bVJpZ2h0IClcblxuICAgIHkxLmluKCBkaWZmIClcblxuICAgIGlmKCBpc1N0ZXJlbyApIHtcbiAgICAgIGxldCB4MV8xID0gZy5oaXN0b3J5KCksIHgyXzEgPSBnLmhpc3RvcnkoKSwgeTFfMSA9IGcuaGlzdG9yeSgpLCB5Ml8xID0gZy5oaXN0b3J5KClcblxuICAgICAgaW4xYTBfMSA9IGcubXVsKCB4MV8xLmluKCBpbnB1dFsxXSApLCBhMCApXG4gICAgICB4MWExXzEgID0gZy5tdWwoIHgyXzEuaW4oIHgxXzEub3V0ICksIGExIClcbiAgICAgIHgyYTJfMSAgPSBnLm11bCggeDJfMS5vdXQsICAgICAgICAgICAgYTIgKVxuXG4gICAgICBsZXQgc3VtTGVmdF8xID0gZy5hZGQoIGluMWEwXzEsIHgxYTFfMSwgeDJhMl8xIClcblxuICAgICAgeTFiMV8xID0gZy5tdWwoIHkyXzEuaW4oIHkxXzEub3V0ICksIGIxIClcbiAgICAgIHkyYjJfMSA9IGcubXVsKCB5Ml8xLm91dCwgYjIgKVxuXG4gICAgICBsZXQgc3VtUmlnaHRfMSA9IGcuYWRkKCB5MWIxXzEsIHkyYjJfMSApXG5cbiAgICAgIGxldCBkaWZmXzEgPSBnLnN1Yiggc3VtTGVmdF8xLCBzdW1SaWdodF8xIClcblxuICAgICAgeTFfMS5pbiggZGlmZl8xIClcbiAgICAgIFxuICAgICAgcmV0dXJuVmFsdWUgPSBbIGRpZmYsIGRpZmZfMSBdXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm5WYWx1ZSA9IGRpZmZcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgfVxuXG4gIGxldCBCaXF1YWQgPSBpbnB1dFByb3BzID0+IHtcbiAgICBsZXQgYmlxdWFkID0gT2JqZWN0LmNyZWF0ZSggZmlsdGVyIClcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgQmlxdWFkLmRlZmF1bHRzLCBpbnB1dFByb3BzICkgXG4gICAgXG4gICAgT2JqZWN0LmFzc2lnbiggYmlxdWFkLCBwcm9wcyApXG5cbiAgICBsZXQgaXNTdGVyZW8gPSBiaXF1YWQuaW5wdXQuaXNTdGVyZW9cblxuICAgIGJpcXVhZC5fX2NyZWF0ZUdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgICBiaXF1YWQuZ3JhcGggPSBHaWJiZXJpc2guZ2VuaXNoLmJpcXVhZCggZy5pbignaW5wdXQnKSwgZy5tdWwoIGcuaW4oJ2N1dG9mZicpLCBnLmdlbi5zYW1wbGVyYXRlIC8gNCApLCAgZy5pbignUScpLCBiaXF1YWQubW9kZSwgaXNTdGVyZW8gKVxuICAgIH1cblxuICAgIGJpcXVhZC5fX2NyZWF0ZUdyYXBoKClcbiAgICBiaXF1YWQuX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbICdtb2RlJyBdXG5cbiAgICBjb25zdCBfX291dCA9IEdpYmJlcmlzaC5mYWN0b3J5KFxuICAgICAgYmlxdWFkLFxuICAgICAgYmlxdWFkLmdyYXBoLFxuICAgICAgWydmaWx0ZXJzJywnRmlsdGVyMTJCaXF1YWQnXSwgXG4gICAgICBwcm9wc1xuICAgIClcblxuICAgIHJldHVybiBfX291dFxuICB9XG5cbiAgQmlxdWFkLmRlZmF1bHRzID0ge1xuICAgIGlucHV0OjAsXG4gICAgUTogLjE1LFxuICAgIGN1dG9mZjouMDUsXG4gICAgbW9kZTowXG4gIH1cblxuICByZXR1cm4gQmlxdWFkXG5cbn1cblxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApXG5cbmxldCBjb21iRmlsdGVyID0gZnVuY3Rpb24oIF9pbnB1dCwgY29tYkxlbmd0aCwgZGFtcGluZz0uNSouNCwgZmVlZGJhY2tDb2VmZj0uODQgKSB7XG4gIGxldCBsYXN0U2FtcGxlICAgPSBnLmhpc3RvcnkoKSxcbiAgXHQgIHJlYWRXcml0ZUlkeCA9IGcuY291bnRlciggMSwwLGNvbWJMZW5ndGggKSxcbiAgICAgIGNvbWJCdWZmZXIgICA9IGcuZGF0YSggY29tYkxlbmd0aCApLFxuXHQgICAgb3V0ICAgICAgICAgID0gZy5wZWVrKCBjb21iQnVmZmVyLCByZWFkV3JpdGVJZHgsIHsgaW50ZXJwOidub25lJywgbW9kZTonc2FtcGxlcycgfSksXG4gICAgICBzdG9yZUlucHV0ICAgPSBnLm1lbW8oIGcuYWRkKCBnLm11bCggb3V0LCBnLnN1YiggMSwgZGFtcGluZykpLCBnLm11bCggbGFzdFNhbXBsZS5vdXQsIGRhbXBpbmcgKSApIClcbiAgICAgIFxuICBsYXN0U2FtcGxlLmluKCBzdG9yZUlucHV0IClcbiBcbiAgZy5wb2tlKCBjb21iQnVmZmVyLCBnLmFkZCggX2lucHV0LCBnLm11bCggc3RvcmVJbnB1dCwgZmVlZGJhY2tDb2VmZiApICksIHJlYWRXcml0ZUlkeCApXG4gXG4gIHJldHVybiBvdXRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb21iRmlsdGVyXG4iLCJjb25zdCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICAgIGZpbHRlciA9IHJlcXVpcmUoICcuL2ZpbHRlci5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIEdpYmJlcmlzaC5nZW5pc2guZGlvZGVaREYgPSAoIGlucHV0LCBfUSwgZnJlcSwgc2F0dXJhdGlvbiwgaXNTdGVyZW89ZmFsc2UgKSA9PiB7XG4gICAgY29uc3QgaVQgPSAxIC8gZy5nZW4uc2FtcGxlcmF0ZSxcbiAgICAgICAgICBrejEgPSBnLmhpc3RvcnkoMCksXG4gICAgICAgICAga3oyID0gZy5oaXN0b3J5KDApLFxuICAgICAgICAgIGt6MyA9IGcuaGlzdG9yeSgwKSxcbiAgICAgICAgICBrejQgPSBnLmhpc3RvcnkoMClcblxuICAgIGxldCAgIGthMSA9IDEuMCxcbiAgICAgICAgICBrYTIgPSAwLjUsXG4gICAgICAgICAga2EzID0gMC41LFxuICAgICAgICAgIGthNCA9IDAuNSxcbiAgICAgICAgICBraW5keCA9IDAgICBcblxuICAgIC8vIFhYWCB0aGlzIGlzIHdoZXJlIHRoZSBtYWdpYyBudW1iZXIgaGFwZW5zIGZvciBRLi4uXG4gICAgY29uc3QgUSA9IGcubWVtbyggZy5hZGQoIC41LCBnLm11bCggX1EsIGcuYWRkKCA1LCBnLnN1YiggNSwgZy5tdWwoIGcuZGl2KCBmcmVxLCAyMDAwMCAgKSwgNSApICkgKSApICkgKVxuICAgIC8vIGt3ZCA9IDIgKiAkTV9QSSAqIGFjZltraW5keF1cbiAgICBjb25zdCBrd2QgPSBnLm1lbW8oIGcubXVsKCBNYXRoLlBJICogMiwgZnJlcSApIClcblxuICAgIC8vIGt3YSA9ICgyL2lUKSAqIHRhbihrd2QgKiBpVC8yKSBcbiAgICBjb25zdCBrd2EgPWcubWVtbyggZy5tdWwoIDIvaVQsIGcudGFuKCBnLm11bCgga3dkLCBpVC8yICkgKSApIClcblxuICAgIC8vIGtHICA9IGt3YSAqIGlULzIgXG4gICAgY29uc3Qga2cgPSBnLm1lbW8oIGcubXVsKCBrd2EsIGlULzIgKSApXG4gICAgXG4gICAgY29uc3Qga0c0ID0gZy5tZW1vKCBnLm11bCggLjUsIGcuZGl2KCBrZywgZy5hZGQoIDEsIGtnICkgKSApIClcbiAgICBjb25zdCBrRzMgPSBnLm1lbW8oIGcubXVsKCAuNSwgZy5kaXYoIGtnLCBnLnN1YiggZy5hZGQoIDEsIGtnICksIGcubXVsKCBnLm11bCggLjUsIGtnICksIGtHNCApICkgKSApIClcbiAgICBjb25zdCBrRzIgPSBnLm1lbW8oIGcubXVsKCAuNSwgZy5kaXYoIGtnLCBnLnN1YiggZy5hZGQoIDEsIGtnICksIGcubXVsKCBnLm11bCggLjUsIGtnICksIGtHMyApICkgKSApIClcbiAgICBjb25zdCBrRzEgPSBnLm1lbW8oIGcuZGl2KCBrZywgZy5zdWIoIGcuYWRkKCAxLCBrZyApLCBnLm11bCgga2csIGtHMiApICkgKSApXG5cbiAgICBjb25zdCBrR0FNTUEgPSBnLm1lbW8oIGcubXVsKCBnLm11bCgga0c0LCBrRzMgKSAsIGcubXVsKCBrRzIsIGtHMSApICkgKVxuXG4gICAgY29uc3Qga1NHMSA9IGcubWVtbyggZy5tdWwoIGcubXVsKCBrRzQsIGtHMyApLCBrRzIgKSApIFxuXG4gICAgY29uc3Qga1NHMiA9IGcubWVtbyggZy5tdWwoIGtHNCwga0czKSApICBcbiAgICBjb25zdCBrU0czID0ga0c0IFxuICAgIGxldCBrU0c0ID0gMS4wIFxuICAgIC8vIGtrID0gNC4wKihrUSAtIDAuNSkvKDI1LjAgLSAwLjUpXG4gICAgY29uc3Qga2FscGhhID0gZy5tZW1vKCBnLmRpdigga2csIGcuYWRkKDEuMCwga2cpICkgKVxuXG4gICAgY29uc3Qga2JldGExID0gZy5tZW1vKCBnLmRpdiggMS4wLCBnLnN1YiggZy5hZGQoIDEsIGtnICksIGcubXVsKCBrZywga0cyICkgKSApIClcbiAgICBjb25zdCBrYmV0YTIgPSBnLm1lbW8oIGcuZGl2KCAxLjAsIGcuc3ViKCBnLmFkZCggMSwga2cgKSwgZy5tdWwoIGcubXVsKCAuNSwga2cgKSwga0czICkgKSApIClcbiAgICBjb25zdCBrYmV0YTMgPSBnLm1lbW8oIGcuZGl2KCAxLjAsIGcuc3ViKCBnLmFkZCggMSwga2cgKSwgZy5tdWwoIGcubXVsKCAuNSwga2cgKSwga0c0ICkgKSApIClcbiAgICBjb25zdCBrYmV0YTQgPSBnLm1lbW8oIGcuZGl2KCAxLjAsIGcuYWRkKCAxLCBrZyApICkgKSBcblxuICAgIGNvbnN0IGtnYW1tYTEgPSBnLm1lbW8oIGcuYWRkKCAxLCBnLm11bCgga0cxLCBrRzIgKSApIClcbiAgICBjb25zdCBrZ2FtbWEyID0gZy5tZW1vKCBnLmFkZCggMSwgZy5tdWwoIGtHMiwga0czICkgKSApXG4gICAgY29uc3Qga2dhbW1hMyA9IGcubWVtbyggZy5hZGQoIDEsIGcubXVsKCBrRzMsIGtHNCApICkgKVxuXG4gICAgY29uc3Qga2RlbHRhMSA9IGtnXG4gICAgY29uc3Qga2RlbHRhMiA9IGcubWVtbyggZy5tdWwoIDAuNSwga2cgKSApXG4gICAgY29uc3Qga2RlbHRhMyA9IGcubWVtbyggZy5tdWwoIDAuNSwga2cgKSApXG5cbiAgICBjb25zdCBrZXBzaWxvbjEgPSBrRzJcbiAgICBjb25zdCBrZXBzaWxvbjIgPSBrRzNcbiAgICBjb25zdCBrZXBzaWxvbjMgPSBrRzRcblxuICAgIGNvbnN0IGtsYXN0Y3V0ID0gZnJlcVxuXG4gICAgLy87OyBmZWVkYmFjayBpbnB1dHMgXG4gICAgY29uc3Qga2ZiNCA9IGcubWVtbyggZy5tdWwoIGtiZXRhNCAsIGt6NC5vdXQgKSApIFxuICAgIGNvbnN0IGtmYjMgPSBnLm1lbW8oIGcubXVsKCBrYmV0YTMsIGcuYWRkKCBrejMub3V0LCBnLm11bCgga2ZiNCwga2RlbHRhMyApICkgKSApXG4gICAgY29uc3Qga2ZiMiA9IGcubWVtbyggZy5tdWwoIGtiZXRhMiwgZy5hZGQoIGt6Mi5vdXQsIGcubXVsKCBrZmIzLCBrZGVsdGEyICkgKSApIClcblxuICAgIC8vOzsgZmVlZGJhY2sgcHJvY2Vzc1xuXG4gICAgY29uc3Qga2ZibzEgPSBnLm1lbW8oIGcubXVsKCBrYmV0YTEsIGcuYWRkKCBrejEub3V0LCBnLm11bCgga2ZiMiwga2RlbHRhMSApICkgKSApIFxuICAgIGNvbnN0IGtmYm8yID0gZy5tZW1vKCBnLm11bCgga2JldGEyLCBnLmFkZCgga3oyLm91dCwgZy5tdWwoIGtmYjMsIGtkZWx0YTIgKSApICkgKSBcbiAgICBjb25zdCBrZmJvMyA9IGcubWVtbyggZy5tdWwoIGtiZXRhMywgZy5hZGQoIGt6My5vdXQsIGcubXVsKCBrZmI0LCBrZGVsdGEzICkgKSApICkgXG4gICAgY29uc3Qga2ZibzQgPSBrZmI0XG5cbiAgICBjb25zdCBrU0lHTUEgPSBnLm1lbW8oIFxuICAgICAgZy5hZGQoIFxuICAgICAgICBnLmFkZCggXG4gICAgICAgICAgZy5tdWwoIGtTRzEsIGtmYm8xICksIFxuICAgICAgICAgIGcubXVsKCBrU0cyLCBrZmJvMiApXG4gICAgICAgICksIFxuICAgICAgICBnLmFkZChcbiAgICAgICAgICBnLm11bCgga1NHMywga2ZibzMgKSwgXG4gICAgICAgICAgZy5tdWwoIGtTRzQsIGtmYm80IClcbiAgICAgICAgKSBcbiAgICAgICkgXG4gICAgKVxuXG4gICAgLy9jb25zdCBrU0lHTUEgPSAxXG4gICAgLy87OyBub24tbGluZWFyIHByb2Nlc3NpbmdcbiAgICAvL2lmIChrbmxwID09IDEpIHRoZW5cbiAgICAvLyAga2luID0gKDEuMCAvIHRhbmgoa3NhdHVyYXRpb24pKSAqIHRhbmgoa3NhdHVyYXRpb24gKiBraW4pXG4gICAgLy9lbHNlaWYgKGtubHAgPT0gMikgdGhlblxuICAgIC8vICBraW4gPSB0YW5oKGtzYXR1cmF0aW9uICoga2luKSBcbiAgICAvL2VuZGlmXG4gICAgLy9cbiAgICAvL2NvbnN0IGtpbiA9IGlucHV0IFxuICAgIGxldCBraW4gPSBpbnB1dC8vZy5tZW1vKCBnLm11bCggZy5kaXYoIDEsIGcudGFuaCggc2F0dXJhdGlvbiApICksIGcudGFuaCggZy5tdWwoIHNhdHVyYXRpb24sIGlucHV0ICkgKSApIClcbiAgICBraW4gPSBnLnRhbmgoIGcubXVsKCBzYXR1cmF0aW9uLCBraW4gKSApXG5cbiAgICBjb25zdCBrdW4gPSBnLmRpdiggZy5zdWIoIGtpbiwgZy5tdWwoIFEsIGtTSUdNQSApICksIGcuYWRkKCAxLCBnLm11bCggUSwga0dBTU1BICkgKSApXG4gICAgLy9jb25zdCBrdW4gPSBnLmRpdiggMSwgZy5hZGQoIDEsIGcubXVsKCBRLCBrR0FNTUEgKSApIClcbiAgICAgICAgLy8oa2luIC0ga2sgKiBrU0lHTUEpIC8gKDEuMCArIGtrICoga0dBTU1BKVxuXG4gICAgLy87OyAxc3Qgc3RhZ2VcbiAgICBsZXQga3hpbiA9IGcubWVtbyggZy5hZGQoIGcuYWRkKCBnLm11bCgga3VuLCBrZ2FtbWExICksIGtmYjIpLCBnLm11bCgga2Vwc2lsb24xLCBrZmJvMSApICkgKVxuICAgIC8vIChrdW4gKiBrZ2FtbWExICsga2ZiMiArIGtlcHNpbG9uMSAqIGtmYm8xKVxuICAgIGxldCBrdiA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBnLm11bCgga2ExLCBreGluICksIGt6MS5vdXQgKSwga2FscGhhICkgKVxuICAgIC8va3YgPSAoa2ExICoga3hpbiAtIGt6MSkgKiBrYWxwaGEgXG4gICAgbGV0IGtscCA9IGcuYWRkKCBrdiwga3oxLm91dCApXG4gICAgLy9rbHAgPSBrdiArIGt6MVxuICAgIGt6MS5pbiggZy5hZGQoIGtscCwga3YgKSApIFxuICAgIC8va3oxID0ga2xwICsga3ZcblxuICAgICAgICAvLzs7IDJuZCBzdGFnZVxuICAgIC8va3hpbiA9IChrbHAgKiBrZ2FtbWEyICsga2ZiMyArIGtlcHNpbG9uMiAqIGtmYm8yKVxuICAgIC8va3YgPSAoa2EyICoga3hpbiAtIGt6MikgKiBrYWxwaGEgXG4gICAgLy9rbHAgPSBrdiArIGt6MlxuICAgIC8va3oyID0ga2xwICsga3ZcblxuICAgIGt4aW4gPSBnLm1lbW8oIGcuYWRkKCBnLmFkZCggZy5tdWwoIGtscCwga2dhbW1hMiApLCBrZmIzKSwgZy5tdWwoIGtlcHNpbG9uMiwga2ZibzIgKSApIClcbiAgICAvLyAoa3VuICoga2dhbW1hMSArIGtmYjIgKyBrZXBzaWxvbjEgKiBrZmJvMSlcbiAgICBrdiA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBnLm11bCgga2EyLCBreGluICksIGt6Mi5vdXQgKSwga2FscGhhICkgKVxuICAgIC8va3YgPSAoa2ExICoga3hpbiAtIGt6MSkgKiBrYWxwaGEgXG4gICAga2xwID0gZy5hZGQoIGt2LCBrejIub3V0ICkgXG4gICAgLy9rbHAgPSBrdiArIGt6MVxuICAgIGt6Mi5pbiggZy5hZGQoIGtscCwga3YgKSApIFxuICAgIC8va3oxID0ga2xwICsga3ZcblxuICAgIC8vOzsgM3JkIHN0YWdlXG4gICAgLy9reGluID0gKGtscCAqIGtnYW1tYTMgKyBrZmI0ICsga2Vwc2lsb24zICoga2ZibzMpXG4gICAgLy9rdiA9IChrYTMgKiBreGluIC0ga3ozKSAqIGthbHBoYSBcbiAgICAvL2tscCA9IGt2ICsga3ozXG4gICAgLy9rejMgPSBrbHAgKyBrdlxuXG4gICAga3hpbiA9IGcubWVtbyggZy5hZGQoIGcuYWRkKCBnLm11bCgga2xwLCBrZ2FtbWEzICksIGtmYjQpLCBnLm11bCgga2Vwc2lsb24zLCBrZmJvMyApICkgKVxuICAgIC8vIChrdW4gKiBrZ2FtbWExICsga2ZiMiArIGtlcHNpbG9uMSAqIGtmYm8xKVxuICAgIGt2ID0gZy5tZW1vKCBnLm11bCggZy5zdWIoIGcubXVsKCBrYTMsIGt4aW4gKSwga3ozLm91dCApLCBrYWxwaGEgKSApXG4gICAgLy9rdiA9IChrYTEgKiBreGluIC0ga3oxKSAqIGthbHBoYSBcbiAgICBrbHAgPSBnLmFkZCgga3YsIGt6My5vdXQgKVxuICAgIC8va2xwID0ga3YgKyBrejFcbiAgICBrejMuaW4oIGcuYWRkKCBrbHAsIGt2ICkgKVxuICAgIC8va3oxID0ga2xwICsga3ZcblxuICAgIC8vOzsgNHRoIHN0YWdlXG4gICAgLy9rdiA9IChrYTQgKiBrbHAgLSBrejQpICoga2FscGhhIFxuICAgIC8va2xwID0ga3YgKyBrejRcbiAgICAvL2t6NCA9IGtscCArIGt2XG5cbiAgICAvLyAoa3VuICoga2dhbW1hMSArIGtmYjIgKyBrZXBzaWxvbjEgKiBrZmJvMSlcbiAgICBrdiA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBnLm11bCgga2E0LCBreGluICksIGt6NC5vdXQgKSwga2FscGhhICkgKVxuICAgIC8va3YgPSAoa2ExICoga3hpbiAtIGt6MSkgKiBrYWxwaGEgXG4gICAga2xwID0gZy5hZGQoIGt2LCBrejQub3V0IClcbiAgICAvL2tscCA9IGt2ICsga3oxXG4gICAga3o0LmluKCBnLmFkZCgga2xwLCBrdiApIClcblxuICAgIC8va3oxID0ga2xwICsga3ZcbiAgICBpZiggaXNTdGVyZW8gKSB7XG4gICAgICAvL2xldCBwb2xlc1IgPSBnLmRhdGEoWyAwLDAsMCwwIF0sIDEsIHsgbWV0YTp0cnVlIH0pLFxuICAgICAgLy8gICAgcmV6elIgPSBnLmNsYW1wKCBnLm11bCggcG9sZXNSWzNdLCByZXogKSApLFxuICAgICAgLy8gICAgb3V0cHV0UiA9IGcuc3ViKCBpbnB1dFsxXSwgcmV6elIgKSAgICAgICAgIFxuXG4gICAgICAvL3BvbGVzUlswXSA9IGcuYWRkKCBwb2xlc1JbMF0sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlswXSApLCBvdXRwdXRSICAgKSwgY3V0b2ZmICkpXG4gICAgICAvL3BvbGVzUlsxXSA9IGcuYWRkKCBwb2xlc1JbMV0sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlsxXSApLCBwb2xlc1JbMF0gKSwgY3V0b2ZmICkpXG4gICAgICAvL3BvbGVzUlsyXSA9IGcuYWRkKCBwb2xlc1JbMl0sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlsyXSApLCBwb2xlc1JbMV0gKSwgY3V0b2ZmICkpXG4gICAgICAvL3BvbGVzUlszXSA9IGcuYWRkKCBwb2xlc1JbM10sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlszXSApLCBwb2xlc1JbMl0gKSwgY3V0b2ZmICkpXG5cbiAgICAgIC8vbGV0IHJpZ2h0ID0gZy5zd2l0Y2goIGlzTG93UGFzcywgcG9sZXNSWzNdLCBnLnN1Yiggb3V0cHV0UiwgcG9sZXNSWzNdICkgKVxuXG4gICAgICAvL3JldHVyblZhbHVlID0gW2xlZnQsIHJpZ2h0XVxuICAgIH1lbHNle1xuICAgICAvLyByZXR1cm5WYWx1ZSA9IGtscFxuICAgIH1cbiAgICAvL3JldHVyblZhbHVlID0ga2xwXG4gICAgXG4gICAgcmV0dXJuIGtscC8vcmV0dXJuVmFsdWUvLyBrbHAvL3JldHVyblZhbHVlXG4gfVxuXG4gIGNvbnN0IERpb2RlWkRGID0gaW5wdXRQcm9wcyA9PiB7XG4gICAgY29uc3QgemRmICAgICAgPSBPYmplY3QuY3JlYXRlKCBmaWx0ZXIgKVxuICAgIGNvbnN0IHByb3BzICAgID0gT2JqZWN0LmFzc2lnbigge30sIERpb2RlWkRGLmRlZmF1bHRzLCBmaWx0ZXIuZGVmYXVsdHMsIGlucHV0UHJvcHMgKVxuICAgIGNvbnN0IGlzU3RlcmVvID0gcHJvcHMuaW5wdXQuaXNTdGVyZW8gXG5cbiAgICBPYmplY3QuYXNzaWduKCB6ZGYsIHByb3BzIClcblxuICAgIGNvbnN0IF9fb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoXG4gICAgICB6ZGYsIFxuICAgICAgR2liYmVyaXNoLmdlbmlzaC5kaW9kZVpERiggZy5pbignaW5wdXQnKSwgZy5pbignUScpLCBnLmluKCdjdXRvZmYnKSwgZy5pbignc2F0dXJhdGlvbicpLCBpc1N0ZXJlbyApLCBcbiAgICAgIFsnZmlsdGVycycsJ0ZpbHRlcjI0VEIzMDMnXSxcbiAgICAgIHByb3BzXG4gICAgKVxuXG4gICAgcmV0dXJuIF9fb3V0IFxuICB9XG5cbiAgRGlvZGVaREYuZGVmYXVsdHMgPSB7XG4gICAgaW5wdXQ6MCxcbiAgICBROiAuNjUsXG4gICAgc2F0dXJhdGlvbjogMSxcbiAgICBjdXRvZmY6LjUgXG4gIH1cblxuICByZXR1cm4gRGlvZGVaREZcblxufVxuIiwibGV0IHVnZW4gPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKVxuXG5sZXQgZmlsdGVyID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG5cbk9iamVjdC5hc3NpZ24oIGZpbHRlciwge1xuICBkZWZhdWx0czogeyBieXBhc3M6ZmFsc2UgfSBcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gZmlsdGVyXG4iLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgZmlsdGVyID0gcmVxdWlyZSggJy4vZmlsdGVyLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuICBHaWJiZXJpc2guZ2VuaXNoLmZpbHRlcjI0ID0gKCBpbnB1dCwgX3JleiwgX2N1dG9mZiwgaXNMb3dQYXNzLCBpc1N0ZXJlbz1mYWxzZSApID0+IHtcbiAgICBsZXQgcmV0dXJuVmFsdWUsXG4gICAgICAgIHBvbGVzTCA9IGcuZGF0YShbIDAsMCwwLDAgXSwgMSwgeyBtZXRhOnRydWUgfSksXG4gICAgICAgIHBlZWtQcm9wcyA9IHsgaW50ZXJwOidub25lJywgbW9kZTonc2ltcGxlJyB9LFxuICAgICAgICByZXogPSBnLm1lbW8oIGcubXVsKCBfcmV6LCA1ICkgKSxcbiAgICAgICAgY3V0b2ZmID0gZy5tZW1vKCBnLmRpdiggX2N1dG9mZiwgMTEwMjUgKSApLFxuICAgICAgICByZXp6TCA9IGcuY2xhbXAoIGcubXVsKCBwb2xlc0xbM10sIHJleiApICksXG4gICAgICAgIG91dHB1dEwgPSBnLnN1YiggaXNTdGVyZW8gPyBpbnB1dFswXSA6IGlucHV0LCByZXp6TCApIFxuXG4gICAgcG9sZXNMWzBdID0gZy5hZGQoIHBvbGVzTFswXSwgZy5tdWwoIGcuYWRkKCBnLm11bCgtMSwgcG9sZXNMWzBdICksIG91dHB1dEwgICApLCBjdXRvZmYgKSlcbiAgICBwb2xlc0xbMV0gPSBnLmFkZCggcG9sZXNMWzFdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc0xbMV0gKSwgcG9sZXNMWzBdICksIGN1dG9mZiApKVxuICAgIHBvbGVzTFsyXSA9IGcuYWRkKCBwb2xlc0xbMl0sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzTFsyXSApLCBwb2xlc0xbMV0gKSwgY3V0b2ZmICkpXG4gICAgcG9sZXNMWzNdID0gZy5hZGQoIHBvbGVzTFszXSwgZy5tdWwoIGcuYWRkKCBnLm11bCgtMSwgcG9sZXNMWzNdICksIHBvbGVzTFsyXSApLCBjdXRvZmYgKSlcbiAgICBcbiAgICBsZXQgbGVmdCA9IGcuc3dpdGNoKCBpc0xvd1Bhc3MsIHBvbGVzTFszXSwgZy5zdWIoIG91dHB1dEwsIHBvbGVzTFszXSApIClcblxuICAgIGlmKCBpc1N0ZXJlbyApIHtcbiAgICAgIGxldCBwb2xlc1IgPSBnLmRhdGEoWyAwLDAsMCwwIF0sIDEsIHsgbWV0YTp0cnVlIH0pLFxuICAgICAgICAgIHJlenpSID0gZy5jbGFtcCggZy5tdWwoIHBvbGVzUlszXSwgcmV6ICkgKSxcbiAgICAgICAgICBvdXRwdXRSID0gZy5zdWIoIGlucHV0WzFdLCByZXp6UiApICAgICAgICAgXG5cbiAgICAgIHBvbGVzUlswXSA9IGcuYWRkKCBwb2xlc1JbMF0sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlswXSApLCBvdXRwdXRSICAgKSwgY3V0b2ZmICkpXG4gICAgICBwb2xlc1JbMV0gPSBnLmFkZCggcG9sZXNSWzFdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc1JbMV0gKSwgcG9sZXNSWzBdICksIGN1dG9mZiApKVxuICAgICAgcG9sZXNSWzJdID0gZy5hZGQoIHBvbGVzUlsyXSwgZy5tdWwoIGcuYWRkKCBnLm11bCgtMSwgcG9sZXNSWzJdICksIHBvbGVzUlsxXSApLCBjdXRvZmYgKSlcbiAgICAgIHBvbGVzUlszXSA9IGcuYWRkKCBwb2xlc1JbM10sIGcubXVsKCBnLmFkZCggZy5tdWwoLTEsIHBvbGVzUlszXSApLCBwb2xlc1JbMl0gKSwgY3V0b2ZmICkpXG5cbiAgICAgIGxldCByaWdodCA9IGcuc3dpdGNoKCBpc0xvd1Bhc3MsIHBvbGVzUlszXSwgZy5zdWIoIG91dHB1dFIsIHBvbGVzUlszXSApIClcblxuICAgICAgcmV0dXJuVmFsdWUgPSBbbGVmdCwgcmlnaHRdXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm5WYWx1ZSA9IGxlZnRcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgfVxuXG4gIGxldCBGaWx0ZXIyNCA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGxldCBmaWx0ZXIyNCAgID0gT2JqZWN0LmNyZWF0ZSggZmlsdGVyIClcbiAgICBsZXQgcHJvcHMgICAgPSBPYmplY3QuYXNzaWduKCB7fSwgRmlsdGVyMjQuZGVmYXVsdHMsIGZpbHRlci5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgbGV0IGlzU3RlcmVvID0gcHJvcHMuaW5wdXQuaXNTdGVyZW8gXG5cbiAgICBjb25zdCBfX291dCA9IEdpYmJlcmlzaC5mYWN0b3J5KFxuICAgICAgZmlsdGVyMjQsIFxuICAgICAgR2liYmVyaXNoLmdlbmlzaC5maWx0ZXIyNCggZy5pbignaW5wdXQnKSwgZy5pbignUScpLCBnLmluKCdjdXRvZmYnKSwgZy5pbignaXNMb3dQYXNzJyksIGlzU3RlcmVvICksIFxuICAgICAgWydmaWx0ZXJzJywnRmlsdGVyMjRDbGFzc2ljJ10sXG4gICAgICBwcm9wc1xuICAgIClcblxuICAgIHJldHVybiBfX291dFxuICB9XG5cblxuICBGaWx0ZXIyNC5kZWZhdWx0cyA9IHtcbiAgICBpbnB1dDowLFxuICAgIFE6IC4yNSxcbiAgICBjdXRvZmY6IDg4MCxcbiAgICBpc0xvd1Bhc3M6MVxuICB9XG5cbiAgcmV0dXJuIEZpbHRlcjI0XG5cbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IGcgPSBHaWJiZXJpc2guZ2VuaXNoXG5cbiAgY29uc3QgZmlsdGVycyA9IHtcbiAgICBGaWx0ZXIyNENsYXNzaWMgOiByZXF1aXJlKCAnLi9maWx0ZXIyNC5qcycgICkoIEdpYmJlcmlzaCApLFxuICAgIEZpbHRlcjI0TW9vZyAgICA6IHJlcXVpcmUoICcuL2xhZGRlckZpbHRlclplcm9EZWxheS5qcycgKSggR2liYmVyaXNoICksXG4gICAgRmlsdGVyMjRUQjMwMyAgIDogcmVxdWlyZSggJy4vZGlvZGVGaWx0ZXJaREYuanMnICkoIEdpYmJlcmlzaCApLFxuICAgIEZpbHRlcjEyQmlxdWFkICA6IHJlcXVpcmUoICcuL2JpcXVhZC5qcycgICAgKSggR2liYmVyaXNoICksXG4gICAgRmlsdGVyMTJTVkYgICAgIDogcmVxdWlyZSggJy4vc3ZmLmpzJyAgICAgICApKCBHaWJiZXJpc2ggKSxcbiAgICBcbiAgICAvLyBub3QgZm9yIHVzZSBieSBlbmQtdXNlcnNcbiAgICBnZW5pc2g6IHtcbiAgICAgIENvbWIgICAgICAgIDogcmVxdWlyZSggJy4vY29tYmZpbHRlci5qcycgKSxcbiAgICAgIEFsbFBhc3MgICAgIDogcmVxdWlyZSggJy4vYWxscGFzcy5qcycgKVxuICAgIH0sXG5cbiAgICBmYWN0b3J5KCBpbnB1dCwgY3V0b2ZmLCByZXNvbmFuY2UsIHNhdHVyYXRpb24gPSBudWxsLCBfcHJvcHMsIGlzU3RlcmVvID0gZmFsc2UgKSB7XG4gICAgICBsZXQgZmlsdGVyZWRPc2MgXG5cbiAgICAgIC8vaWYoIHByb3BzLmZpbHRlclR5cGUgPT09IDEgKSB7XG4gICAgICAvLyAgaWYoIHR5cGVvZiBwcm9wcy5jdXRvZmYgIT09ICdvYmplY3QnICYmIHByb3BzLmN1dG9mZiA+IDEgKSB7XG4gICAgICAvLyAgICBwcm9wcy5jdXRvZmYgPSAuMjVcbiAgICAgIC8vICB9XG4gICAgICAvLyAgaWYoIHR5cGVvZiBwcm9wcy5jdXRvZmYgIT09ICdvYmplY3QnICYmIHByb3BzLmZpbHRlck11bHQgPiAuNSApIHtcbiAgICAgIC8vICAgIHByb3BzLmZpbHRlck11bHQgPSAuMVxuICAgICAgLy8gIH1cbiAgICAgIC8vfVxuICAgICAgbGV0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsdGVycy5kZWZhdWx0cywgX3Byb3BzIClcblxuICAgICAgc3dpdGNoKCBwcm9wcy5maWx0ZXJUeXBlICkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgZmlsdGVyZWRPc2MgPSBnLnpkMjQoIGlucHV0LCBnLm1pbiggZy5pbignUScpLCAuOTk5OSApLCAgZy5taW4oIGN1dG9mZiwgMjAwMDAgKSApXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBmaWx0ZXJlZE9zYyA9IGcuZGlvZGVaREYoIGlucHV0LCBnLm1pbiggZy5pbignUScpLCAuOTk5OSApLCBnLm1pbiggY3V0b2ZmLCAyMDAwMCApLCBnLmluKCdzYXR1cmF0aW9uJyksIGlzU3RlcmVvICkgXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBmaWx0ZXJlZE9zYyA9IGcuc3ZmKCBpbnB1dCwgY3V0b2ZmLCBnLnN1YiggMSwgZy5pbignUScpKSwgcHJvcHMuZmlsdGVyTW9kZSwgaXNTdGVyZW8gKSBcbiAgICAgICAgICBicmVhazsgXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBmaWx0ZXJlZE9zYyA9IGcuYmlxdWFkKCBpbnB1dCwgY3V0b2ZmLCAgZy5pbignUScpLCBwcm9wcy5maWx0ZXJNb2RlLCBpc1N0ZXJlbyApIFxuICAgICAgICAgIGJyZWFrOyBcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIC8vaXNMb3dQYXNzID0gZy5wYXJhbSggJ2xvd1Bhc3MnLCAxICksXG4gICAgICAgICAgZmlsdGVyZWRPc2MgPSBnLmZpbHRlcjI0KCBpbnB1dCwgZy5pbignUScpLCBjdXRvZmYsIHByb3BzLmZpbHRlck1vZGUsIGlzU3RlcmVvIClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAvLyByZXR1cm4gdW5maWx0ZXJlZCBzaWduYWxcbiAgICAgICAgICBmaWx0ZXJlZE9zYyA9IGlucHV0IC8vZy5maWx0ZXIyNCggb3NjV2l0aEdhaW4sIGcuaW4oJ3Jlc29uYW5jZScpLCBjdXRvZmYsIGlzTG93UGFzcyApXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmaWx0ZXJlZE9zY1xuICAgIH0sXG5cbiAgICBkZWZhdWx0czogeyBmaWx0ZXJNb2RlOiAwLCBmaWx0ZXJUeXBlOjAgfVxuICB9XG5cbiAgZmlsdGVycy5leHBvcnQgPSB0YXJnZXQgPT4ge1xuICAgIGZvciggbGV0IGtleSBpbiBmaWx0ZXJzICkge1xuICAgICAgaWYoIGtleSAhPT0gJ2V4cG9ydCcgJiYga2V5ICE9PSAnZ2VuaXNoJyApIHtcbiAgICAgICAgdGFyZ2V0WyBrZXkgXSA9IGZpbHRlcnNbIGtleSBdXG4gICAgICB9XG4gICAgfVxuICB9XG5cbnJldHVybiBmaWx0ZXJzXG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgZmlsdGVyUHJvdG8gPSByZXF1aXJlKCAnLi9maWx0ZXIuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIEdpYmJlcmlzaC5nZW5pc2guemQyNCA9ICggaW5wdXQsIF9RLCBmcmVxLCBpc1N0ZXJlbz1mYWxzZSApID0+IHtcbiAgICBjb25zdCBpVCA9IDEgLyBnLmdlbi5zYW1wbGVyYXRlLFxuICAgICAgICAgIHoxID0gZy5oaXN0b3J5KDApLFxuICAgICAgICAgIHoyID0gZy5oaXN0b3J5KDApLFxuICAgICAgICAgIHozID0gZy5oaXN0b3J5KDApLFxuICAgICAgICAgIHo0ID0gZy5oaXN0b3J5KDApXG4gICAgXG4gICAgY29uc3QgUSA9IGcubWVtbyggZy5hZGQoIC41LCBnLm11bCggX1EsIDIzICkgKSApXG4gICAgLy8ga3dkID0gMiAqICRNX1BJICogYWNmW2tpbmR4XVxuICAgIGNvbnN0IGt3ZCA9IGcubWVtbyggZy5tdWwoIE1hdGguUEkgKiAyLCBmcmVxICkgKVxuXG4gICAgLy8ga3dhID0gKDIvaVQpICogdGFuKGt3ZCAqIGlULzIpIFxuICAgIGNvbnN0IGt3YSA9Zy5tZW1vKCBnLm11bCggMi9pVCwgZy50YW4oIGcubXVsKCBrd2QsIGlULzIgKSApICkgKVxuXG4gICAgLy8ga0cgID0ga3dhICogaVQvMiBcbiAgICBjb25zdCBrZyA9IGcubWVtbyggZy5tdWwoIGt3YSwgaVQvMiApIClcblxuICAgIC8vIGtrID0gNC4wKihrUSAtIDAuNSkvKDI1LjAgLSAwLjUpXG4gICAgY29uc3Qga2sgPSBnLm1lbW8oIGcubXVsKCA0LCBnLmRpdiggZy5zdWIoIFEsIC41ICksIDI0LjUgKSApIClcblxuICAgIC8vIGtnX3BsdXNfMSA9ICgxLjAgKyBrZylcbiAgICBjb25zdCBrZ19wbHVzXzEgPSBnLmFkZCggMSwga2cgKVxuXG4gICAgLy8ga0cgPSBrZyAvIGtnX3BsdXNfMSBcbiAgICBjb25zdCBrRyAgICAgPSBnLm1lbW8oIGcuZGl2KCBrZywga2dfcGx1c18xICkgKSxcbiAgICAgICAgICBrR18yICAgPSBnLm1lbW8oIGcubXVsKCBrRywga0cgKSApLFxuICAgICAgICAgIGtHXzMgICA9IGcubXVsKCBrR18yLCBrRyApLFxuICAgICAgICAgIGtHQU1NQSA9IGcubXVsKCBrR18yLCBrR18yIClcblxuICAgIGNvbnN0IGtTMSA9IGcuZGl2KCB6MS5vdXQsIGtnX3BsdXNfMSApLFxuICAgICAgICAgIGtTMiA9IGcuZGl2KCB6Mi5vdXQsIGtnX3BsdXNfMSApLFxuICAgICAgICAgIGtTMyA9IGcuZGl2KCB6My5vdXQsIGtnX3BsdXNfMSApLFxuICAgICAgICAgIGtTNCA9IGcuZGl2KCB6NC5vdXQsIGtnX3BsdXNfMSApXG5cbiAgICAvL2tTID0ga0dfMyAqIGtTMSAgKyBrR18yICoga1MyICsga0cgKiBrUzMgKyBrUzQgXG4gICAgY29uc3Qga1MgPSBnLm1lbW8oIFxuICAgICAgZy5hZGQoXG4gICAgICAgIGcuYWRkKCBnLm11bChrR18zLCBrUzEpLCBnLm11bCgga0dfMiwga1MyKSApLFxuICAgICAgICBnLmFkZCggZy5tdWwoa0csIGtTMyksIGtTNCApXG4gICAgICApXG4gICAgKVxuXG4gICAgLy9rdSA9IChraW4gLSBrayAqICBrUykgLyAoMSArIGtrICoga0dBTU1BKVxuICAgIGNvbnN0IGt1MSA9IGcuc3ViKCBpbnB1dCwgZy5tdWwoIGtrLCBrUyApIClcbiAgICBjb25zdCBrdTIgPSBnLm1lbW8oIGcuYWRkKCAxLCBnLm11bCgga2ssIGtHQU1NQSApICkgKVxuICAgIGNvbnN0IGt1ICA9IGcubWVtbyggZy5kaXYoIGt1MSwga3UyICkgKVxuXG4gICAgbGV0IGt2ID0gIGcubWVtbyggZy5tdWwoIGcuc3ViKCBrdSwgejEub3V0ICksIGtHICkgKVxuICAgIGxldCBrbHAgPSBnLm1lbW8oIGcuYWRkKCBrdiwgejEub3V0ICkgKVxuICAgIHoxLmluKCBnLmFkZCgga2xwLCBrdiApIClcblxuICAgIGt2ICA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBrbHAsIHoyLm91dCApLCBrRyApIClcbiAgICBrbHAgPSBnLm1lbW8oIGcuYWRkKCBrdiwgejIub3V0ICkgKVxuICAgIHoyLmluKCBnLmFkZCgga2xwLCBrdiApIClcblxuICAgIGt2ICA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBrbHAsIHozLm91dCApLCBrRyApIClcbiAgICBrbHAgPSBnLm1lbW8oIGcuYWRkKCBrdiwgejMub3V0ICkgKVxuICAgIHozLmluKCBnLmFkZCgga2xwLCBrdiApIClcblxuICAgIGt2ICA9IGcubWVtbyggZy5tdWwoIGcuc3ViKCBrbHAsIHo0Lm91dCApLCBrRyApIClcbiAgICBrbHAgPSBnLm1lbW8oIGcuYWRkKCBrdiwgejQub3V0ICkgKVxuICAgIHo0LmluKCBnLmFkZCgga2xwLCBrdiApIClcblxuXG4gICAgaWYoIGlzU3RlcmVvICkge1xuICAgICAgLy9sZXQgcG9sZXNSID0gZy5kYXRhKFsgMCwwLDAsMCBdLCAxLCB7IG1ldGE6dHJ1ZSB9KSxcbiAgICAgIC8vICAgIHJlenpSID0gZy5jbGFtcCggZy5tdWwoIHBvbGVzUlszXSwgcmV6ICkgKSxcbiAgICAgIC8vICAgIG91dHB1dFIgPSBnLnN1YiggaW5wdXRbMV0sIHJlenpSICkgICAgICAgICBcblxuICAgICAgLy9wb2xlc1JbMF0gPSBnLmFkZCggcG9sZXNSWzBdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc1JbMF0gKSwgb3V0cHV0UiAgICksIGN1dG9mZiApKVxuICAgICAgLy9wb2xlc1JbMV0gPSBnLmFkZCggcG9sZXNSWzFdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc1JbMV0gKSwgcG9sZXNSWzBdICksIGN1dG9mZiApKVxuICAgICAgLy9wb2xlc1JbMl0gPSBnLmFkZCggcG9sZXNSWzJdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc1JbMl0gKSwgcG9sZXNSWzFdICksIGN1dG9mZiApKVxuICAgICAgLy9wb2xlc1JbM10gPSBnLmFkZCggcG9sZXNSWzNdLCBnLm11bCggZy5hZGQoIGcubXVsKC0xLCBwb2xlc1JbM10gKSwgcG9sZXNSWzJdICksIGN1dG9mZiApKVxuXG4gICAgICAvL2xldCByaWdodCA9IGcuc3dpdGNoKCBpc0xvd1Bhc3MsIHBvbGVzUlszXSwgZy5zdWIoIG91dHB1dFIsIHBvbGVzUlszXSApIClcblxuICAgICAgLy9yZXR1cm5WYWx1ZSA9IFtsZWZ0LCByaWdodF1cbiAgICB9Ly9lbHNle1xuICAgICAgLy9yZXR1cm5WYWx1ZSA9IGtscFxuICAgIC8vfVxuXG4gICAgcmV0dXJuIGtscC8vcmV0dXJuVmFsdWVcbiAgfVxuXG4gIGNvbnN0IFpkMjQgPSBpbnB1dFByb3BzID0+IHtcbiAgICBjb25zdCBmaWx0ZXIgICA9IE9iamVjdC5jcmVhdGUoIGZpbHRlclByb3RvIClcbiAgICBjb25zdCBwcm9wcyAgICA9IE9iamVjdC5hc3NpZ24oIHt9LCBaZDI0LmRlZmF1bHRzLCBmaWx0ZXIuZGVmYXVsdHMsIGlucHV0UHJvcHMgKVxuICAgIGNvbnN0IGlzU3RlcmVvID0gcHJvcHMuaW5wdXQuaXNTdGVyZW8gXG5cbiAgICBjb25zdCBfX291dCA9IEdpYmJlcmlzaC5mYWN0b3J5KFxuICAgICAgZmlsdGVyLCBcbiAgICAgIEdpYmJlcmlzaC5nZW5pc2guemQyNCggZy5pbignaW5wdXQnKSwgZy5pbignUScpLCBnLmluKCdjdXRvZmYnKSwgaXNTdGVyZW8gKSwgXG4gICAgICBbJ2ZpbHRlcnMnLCdGaWx0ZXIyNE1vb2cnXSxcbiAgICAgIHByb3BzXG4gICAgKVxuXG4gICAgcmV0dXJuIF9fb3V0XG4gIH1cblxuXG4gIFpkMjQuZGVmYXVsdHMgPSB7XG4gICAgaW5wdXQ6MCxcbiAgICBROiAuNzUsXG4gICAgY3V0b2ZmOiA0NDAsXG4gIH1cblxuICByZXR1cm4gWmQyNFxuXG59XG5cbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgZmlsdGVyID0gcmVxdWlyZSggJy4vZmlsdGVyLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcbiAgR2liYmVyaXNoLmdlbmlzaC5zdmYgPSAoIGlucHV0LCBjdXRvZmYsIFEsIG1vZGUsIGlzU3RlcmVvICkgPT4ge1xuICAgIGxldCBkMSA9IGcuZGF0YShbMCwwXSwgMSwgeyBtZXRhOnRydWUgfSksIGQyID0gZy5kYXRhKFswLDBdLCAxLCB7IG1ldGE6dHJ1ZSB9KSxcbiAgICAgICAgcGVla1Byb3BzID0geyBtb2RlOidzaW1wbGUnLCBpbnRlcnA6J25vbmUnIH1cblxuICAgIGxldCBmMSA9IGcubWVtbyggZy5tdWwoIDIgKiBNYXRoLlBJLCBnLmRpdiggY3V0b2ZmLCBnLmdlbi5zYW1wbGVyYXRlICkgKSApXG4gICAgbGV0IG9uZU92ZXJRID0gZy5tZW1vKCBnLmRpdiggMSwgUSApIClcbiAgICBsZXQgbCA9IGcubWVtbyggZy5hZGQoIGQyWzBdLCBnLm11bCggZjEsIGQxWzBdICkgKSApLFxuICAgICAgICBoID0gZy5tZW1vKCBnLnN1YiggZy5zdWIoIGlzU3RlcmVvID8gaW5wdXRbMF0gOiBpbnB1dCwgbCApLCBnLm11bCggUSwgZDFbMF0gKSApICksXG4gICAgICAgIGIgPSBnLm1lbW8oIGcuYWRkKCBnLm11bCggZjEsIGggKSwgZDFbMF0gKSApLFxuICAgICAgICBuID0gZy5tZW1vKCBnLmFkZCggaCwgbCApIClcblxuICAgIGQxWzBdID0gYlxuICAgIGQyWzBdID0gbFxuXG4gICAgbGV0IG91dCA9IGcuc2VsZWN0b3IoIG1vZGUsIGwsIGgsIGIsIG4gKVxuXG4gICAgbGV0IHJldHVyblZhbHVlXG4gICAgaWYoIGlzU3RlcmVvICkge1xuICAgICAgbGV0IGQxMiA9IGcuZGF0YShbMCwwXSwgMSwgeyBtZXRhOnRydWUgfSksIGQyMiA9IGcuZGF0YShbMCwwXSwgMSwgeyBtZXRhOnRydWUgfSlcbiAgICAgIGxldCBsMiA9IGcubWVtbyggZy5hZGQoIGQyMlswXSwgZy5tdWwoIGYxLCBkMTJbMF0gKSApICksXG4gICAgICAgICAgaDIgPSBnLm1lbW8oIGcuc3ViKCBnLnN1YiggaW5wdXRbMV0sIGwyICksIGcubXVsKCBRLCBkMTJbMF0gKSApICksXG4gICAgICAgICAgYjIgPSBnLm1lbW8oIGcuYWRkKCBnLm11bCggZjEsIGgyICksIGQxMlswXSApICksXG4gICAgICAgICAgbjIgPSBnLm1lbW8oIGcuYWRkKCBoMiwgbDIgKSApXG5cbiAgICAgIGQxMlswXSA9IGIyXG4gICAgICBkMjJbMF0gPSBsMlxuXG4gICAgICBsZXQgb3V0MiA9IGcuc2VsZWN0b3IoIG1vZGUsIGwyLCBoMiwgYjIsIG4yIClcblxuICAgICAgcmV0dXJuVmFsdWUgPSBbIG91dCwgb3V0MiBdXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm5WYWx1ZSA9IG91dFxuICAgIH1cblxuICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICB9XG5cbiAgbGV0IFNWRiA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGNvbnN0IHN2ZiA9IE9iamVjdC5jcmVhdGUoIGZpbHRlciApXG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgU1ZGLmRlZmF1bHRzLCBmaWx0ZXIuZGVmYXVsdHMsIGlucHV0UHJvcHMgKSBcblxuICAgIGNvbnN0IGlzU3RlcmVvID0gcHJvcHMuaW5wdXQuaXNTdGVyZW9cbiAgICBcbiAgICAvLyBYWFggTkVFRFMgUkVGQUNUT1JJTkdcbiAgICBjb25zdCBfX291dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCBcbiAgICAgIHN2ZixcbiAgICAgIEdpYmJlcmlzaC5nZW5pc2guc3ZmKCBnLmluKCdpbnB1dCcpLCBnLm11bCggZy5pbignY3V0b2ZmJyksIGcuZ2VuLnNhbXBsZXJhdGUgLyA1ICksIGcuc3ViKCAxLCBnLmluKCdRJykgKSwgZy5pbignbW9kZScpLCBpc1N0ZXJlbyApLCBcbiAgICAgIFsnZmlsdGVycycsJ0ZpbHRlcjEyU1ZGJ10sIFxuICAgICAgcHJvcHNcbiAgICApXG5cbiAgICByZXR1cm4gX19vdXRcbiAgfVxuXG5cbiAgU1ZGLmRlZmF1bHRzID0ge1xuICAgIGlucHV0OjAsXG4gICAgUTogLjY1LFxuICAgIGN1dG9mZjo0NDAsXG4gICAgbW9kZTowXG4gIH1cblxuICByZXR1cm4gU1ZGXG5cbn1cblxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgIGVmZmVjdCA9IHJlcXVpcmUoICcuL2VmZmVjdC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gXG5sZXQgQml0Q3J1c2hlciA9IGlucHV0UHJvcHMgPT4ge1xuICBjb25zdCAgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7IGJpdENydXNoZXJMZW5ndGg6IDQ0MTAwIH0sIEJpdENydXNoZXIuZGVmYXVsdHMsIGVmZmVjdC5kZWZhdWx0cywgaW5wdXRQcm9wcyApLFxuICAgICAgICAgYml0Q3J1c2hlciA9IE9iamVjdC5jcmVhdGUoIGVmZmVjdCApXG5cbiAgbGV0IG91dFxuXG4gIGJpdENydXNoZXIuX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBpc1N0ZXJlbyA9IGZhbHNlXG4gICAgaWYoIG91dCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgaXNTdGVyZW8gPSB0eXBlb2YgcHJvcHMuaW5wdXQuaXNTdGVyZW8gIT09ICd1bmRlZmluZWQnID8gcHJvcHMuaW5wdXQuaXNTdGVyZW8gOiBmYWxzZSBcbiAgICB9ZWxzZXtcbiAgICAgIGlzU3RlcmVvID0gb3V0LmlucHV0LmlzU3RlcmVvXG4gICAgICBvdXQuaXNTdGVyZW8gPSBpc1N0ZXJlb1xuICAgIH1cblxuICAgIGxldCBpbnB1dCA9IGcuaW4oICdpbnB1dCcgKSxcbiAgICAgICAgaW5wdXRHYWluID0gZy5pbiggJ2lucHV0R2FpbicgKSxcbiAgICAgICAgYml0RGVwdGggPSBnLmluKCAnYml0RGVwdGgnICksXG4gICAgICAgIHNhbXBsZVJhdGUgPSBnLmluKCAnc2FtcGxlUmF0ZScgKSxcbiAgICAgICAgbGVmdElucHV0ID0gaXNTdGVyZW8gPyBpbnB1dFsgMCBdIDogaW5wdXQsXG4gICAgICAgIHJpZ2h0SW5wdXQgPSBpc1N0ZXJlbyA/IGlucHV0WyAxIF0gOiBudWxsXG4gICAgXG4gICAgbGV0IHN0b3JlTCA9IGcuaGlzdG9yeSgwKVxuICAgIGxldCBzYW1wbGVSZWR1eENvdW50ZXIgPSBnLmNvdW50ZXIoIHNhbXBsZVJhdGUsIDAsIDEgKVxuXG4gICAgbGV0IGJpdE11bHQgPSBnLnBvdyggZy5tdWwoIGJpdERlcHRoLCAxNiApLCAyIClcbiAgICBsZXQgY3J1c2hlZEwgPSBnLmRpdiggZy5mbG9vciggZy5tdWwoIGcubXVsKCBsZWZ0SW5wdXQsIGlucHV0R2FpbiApLCBiaXRNdWx0ICkgKSwgYml0TXVsdCApXG5cbiAgICBsZXQgb3V0TCA9IGcuc3dpdGNoKFxuICAgICAgc2FtcGxlUmVkdXhDb3VudGVyLndyYXAsXG4gICAgICBjcnVzaGVkTCxcbiAgICAgIHN0b3JlTC5vdXRcbiAgICApXG5cbiAgICBpZiggaXNTdGVyZW8gKSB7XG4gICAgICBsZXQgc3RvcmVSID0gZy5oaXN0b3J5KDApXG4gICAgICBsZXQgY3J1c2hlZFIgPSBnLmRpdiggZy5mbG9vciggZy5tdWwoIGcubXVsKCByaWdodElucHV0LCBpbnB1dEdhaW4gKSwgYml0TXVsdCApICksIGJpdE11bHQgKVxuXG4gICAgICBsZXQgb3V0UiA9IGcudGVybmFyeSggXG4gICAgICAgIHNhbXBsZVJlZHV4Q291bnRlci53cmFwLFxuICAgICAgICBjcnVzaGVkUixcbiAgICAgICAgc3RvcmVMLm91dFxuICAgICAgKVxuXG4gICAgICBiaXRDcnVzaGVyLmdyYXBoID0gWyBvdXRMLCBvdXRSIF1cbiAgICB9ZWxzZXtcbiAgICAgIGJpdENydXNoZXIuZ3JhcGggPSBvdXRMXG4gICAgfVxuICB9XG5cbiAgYml0Q3J1c2hlci5fX2NyZWF0ZUdyYXBoKClcbiAgYml0Q3J1c2hlci5fX3JlcXVpcmVzUmVjb21waWxhdGlvbiA9IFsgJ2lucHV0JyBdXG5cbiAgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgIGJpdENydXNoZXIsXG4gICAgYml0Q3J1c2hlci5ncmFwaCxcbiAgICBbJ2Z4JywnYml0Q3J1c2hlciddLCBcbiAgICBwcm9wcyBcbiAgKVxuICByZXR1cm4gb3V0IFxufVxuXG5CaXRDcnVzaGVyLmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBiaXREZXB0aDouNSxcbiAgc2FtcGxlUmF0ZTogLjVcbn1cblxucmV0dXJuIEJpdENydXNoZXJcblxufVxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgIGVmZmVjdCA9IHJlcXVpcmUoICcuL2VmZmVjdC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGxldCBwcm90byA9IE9iamVjdC5jcmVhdGUoIGVmZmVjdCApXG5cbiAgbGV0IFNodWZmbGVyID0gaW5wdXRQcm9wcyA9PiB7XG4gICAgbGV0IGJ1ZmZlclNodWZmbGVyID0gT2JqZWN0LmNyZWF0ZSggcHJvdG8gKSxcbiAgICAgICAgYnVmZmVyU2l6ZSA9IDg4MjAwXG5cbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oIHt9LCBTaHVmZmxlci5kZWZhdWx0cywgZWZmZWN0LmRlZmF1bHRzLCBpbnB1dFByb3BzIClcbiAgICBcbiAgICBsZXQgb3V0XG4gICAgYnVmZmVyU2h1ZmZsZXIuX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGlzU3RlcmVvID0gZmFsc2VcbiAgICAgIGlmKCBvdXQgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgaXNTdGVyZW8gPSB0eXBlb2YgcHJvcHMuaW5wdXQuaXNTdGVyZW8gIT09ICd1bmRlZmluZWQnID8gcHJvcHMuaW5wdXQuaXNTdGVyZW8gOiB0cnVlIFxuICAgICAgfWVsc2V7XG4gICAgICAgIGlzU3RlcmVvID0gb3V0LmlucHV0LmlzU3RlcmVvXG4gICAgICAgIC8vb3V0LmlzU3RlcmVvID0gaXNTdGVyZW9cbiAgICAgIH0gICAgICBcbiAgICAgIFxuICAgICAgY29uc3QgcGhhc2UgPSBnLmFjY3VtKCAxLDAseyBzaG91bGRXcmFwOiBmYWxzZSB9KVxuXG4gICAgICBjb25zdCBpbnB1dCA9IGcuaW4oICdpbnB1dCcgKSxcbiAgICAgICAgICAgIGlucHV0R2FpbiA9IGcuaW4oICdpbnB1dEdhaW4nICksXG4gICAgICAgICAgICBfX2xlZnRJbnB1dCA9IGlzU3RlcmVvID8gaW5wdXRbIDAgXSA6IGlucHV0LFxuICAgICAgICAgICAgX19yaWdodElucHV0ID0gaXNTdGVyZW8gPyBpbnB1dFsgMSBdIDogbnVsbCxcbiAgICAgICAgICAgIGxlZnRJbnB1dCA9IGcubXVsKCBfX2xlZnRJbnB1dCwgaW5wdXRHYWluICksXG4gICAgICAgICAgICByaWdodElucHV0ID0gZy5tdWwoIF9fcmlnaHRJbnB1dCwgaW5wdXRHYWluICksXG4gICAgICAgICAgICByYXRlT2ZTaHVmZmxpbmcgPSBnLmluKCAncmF0ZScgKSxcbiAgICAgICAgICAgIGNoYW5jZU9mU2h1ZmZsaW5nID0gZy5pbiggJ2NoYW5jZScgKSxcbiAgICAgICAgICAgIHJldmVyc2VDaGFuY2UgPSBnLmluKCAncmV2ZXJzZUNoYW5jZScgKSxcbiAgICAgICAgICAgIHJlcGl0Y2hDaGFuY2UgPSBnLmluKCAncmVwaXRjaENoYW5jZScgKSxcbiAgICAgICAgICAgIHJlcGl0Y2hNaW4gPSBnLmluKCAncmVwaXRjaE1pbicgKSxcbiAgICAgICAgICAgIHJlcGl0Y2hNYXggPSBnLmluKCAncmVwaXRjaE1heCcgKVxuXG4gICAgICBsZXQgcGl0Y2hNZW1vcnkgPSBnLmhpc3RvcnkoMSlcblxuICAgICAgbGV0IHNob3VsZFNodWZmbGVDaGVjayA9IGcuZXEoIGcubW9kKCBwaGFzZSwgcmF0ZU9mU2h1ZmZsaW5nICksIDAgKVxuICAgICAgbGV0IGlzU2h1ZmZsaW5nID0gZy5tZW1vKCBnLnNhaCggZy5sdCggZy5ub2lzZSgpLCBjaGFuY2VPZlNodWZmbGluZyApLCBzaG91bGRTaHVmZmxlQ2hlY2ssIDAgKSApIFxuXG4gICAgICAvLyBpZiB3ZSBhcmUgc2h1ZmZsaW5nIGFuZCBvbiBhIHJlcGVhdCBib3VuZGFyeS4uLlxuICAgICAgbGV0IHNodWZmbGVDaGFuZ2VkID0gZy5tZW1vKCBnLmFuZCggc2hvdWxkU2h1ZmZsZUNoZWNrLCBpc1NodWZmbGluZyApIClcbiAgICAgIGxldCBzaG91bGRSZXZlcnNlID0gZy5sdCggZy5ub2lzZSgpLCByZXZlcnNlQ2hhbmNlICksXG4gICAgICAgICAgcmV2ZXJzZU1vZCA9IGcuc3dpdGNoKCBzaG91bGRSZXZlcnNlLCAtMSwgMSApXG5cbiAgICAgIGxldCBwaXRjaCA9IGcuaWZlbHNlKCBcbiAgICAgICAgZy5hbmQoIHNodWZmbGVDaGFuZ2VkLCBnLmx0KCBnLm5vaXNlKCksIHJlcGl0Y2hDaGFuY2UgKSApLFxuICAgICAgICBnLm1lbW8oIGcubXVsKCBnLmFkZCggcmVwaXRjaE1pbiwgZy5tdWwoIGcuc3ViKCByZXBpdGNoTWF4LCByZXBpdGNoTWluICksIGcubm9pc2UoKSApICksIHJldmVyc2VNb2QgKSApLFxuICAgICAgICByZXZlcnNlTW9kXG4gICAgICApXG4gICAgICBcbiAgICAgIC8vIG9ubHkgc3dpdGNoIHBpdGNoZXMgb24gcmVwZWF0IGJvdW5kYXJpZXNcbiAgICAgIHBpdGNoTWVtb3J5LmluKCBnLnN3aXRjaCggc2h1ZmZsZUNoYW5nZWQsIHBpdGNoLCBwaXRjaE1lbW9yeS5vdXQgKSApXG5cbiAgICAgIGxldCBmYWRlTGVuZ3RoID0gZy5tZW1vKCBnLmRpdiggcmF0ZU9mU2h1ZmZsaW5nLCAxMDAgKSApLFxuICAgICAgICAgIGZhZGVJbmNyID0gZy5tZW1vKCBnLmRpdiggMSwgZmFkZUxlbmd0aCApIClcblxuICAgICAgY29uc3QgYnVmZmVyTCA9IGcuZGF0YSggYnVmZmVyU2l6ZSApXG4gICAgICBjb25zdCBidWZmZXJSID0gaXNTdGVyZW8gPyBnLmRhdGEoIGJ1ZmZlclNpemUgKSA6IG51bGxcbiAgICAgIGxldCByZWFkUGhhc2UgPSBnLmFjY3VtKCBwaXRjaE1lbW9yeS5vdXQsIDAsIHsgc2hvdWxkV3JhcDpmYWxzZSB9KSBcbiAgICAgIGxldCBzdHV0dGVyID0gZy53cmFwKCBnLnN1YiggZy5tb2QoIHJlYWRQaGFzZSwgYnVmZmVyU2l6ZSApLCAyMjA1MCApLCAwLCBidWZmZXJTaXplIClcblxuICAgICAgbGV0IG5vcm1hbFNhbXBsZSA9IGcucGVlayggYnVmZmVyTCwgZy5hY2N1bSggMSwgMCwgeyBtYXg6ODgyMDAgfSksIHsgbW9kZTonc2ltcGxlJyB9KVxuXG4gICAgICBsZXQgc3R1dHRlclNhbXBsZVBoYXNlID0gZy5zd2l0Y2goIGlzU2h1ZmZsaW5nLCBzdHV0dGVyLCBnLm1vZCggcmVhZFBoYXNlLCBidWZmZXJTaXplICkgKVxuICAgICAgbGV0IHN0dXR0ZXJTYW1wbGUgPSBnLm1lbW8oIGcucGVlayggXG4gICAgICAgIGJ1ZmZlckwsIFxuICAgICAgICBzdHV0dGVyU2FtcGxlUGhhc2UsXG4gICAgICAgIHsgbW9kZTonc2FtcGxlcycgfVxuICAgICAgKSApXG4gICAgICBcbiAgICAgIGxldCBzdHV0dGVyU2hvdWxkRmFkZUluID0gZy5hbmQoIHNodWZmbGVDaGFuZ2VkLCBpc1NodWZmbGluZyApXG4gICAgICBsZXQgc3R1dHRlclBoYXNlID0gZy5hY2N1bSggMSwgc2h1ZmZsZUNoYW5nZWQsIHsgc2hvdWxkV3JhcDogZmFsc2UgfSlcblxuICAgICAgbGV0IGZhZGVJbkFtb3VudCA9IGcubWVtbyggZy5kaXYoIHN0dXR0ZXJQaGFzZSwgZmFkZUxlbmd0aCApIClcbiAgICAgIGxldCBmYWRlT3V0QW1vdW50ID0gZy5kaXYoIGcuc3ViKCByYXRlT2ZTaHVmZmxpbmcsIHN0dXR0ZXJQaGFzZSApLCBnLnN1YiggcmF0ZU9mU2h1ZmZsaW5nLCBmYWRlTGVuZ3RoICkgKVxuICAgICAgXG4gICAgICBsZXQgZmFkZWRTdHV0dGVyID0gZy5pZmVsc2UoXG4gICAgICAgIGcubHQoIHN0dXR0ZXJQaGFzZSwgZmFkZUxlbmd0aCApLFxuICAgICAgICBnLm1lbW8oIGcubXVsKCBnLnN3aXRjaCggZy5sdCggZmFkZUluQW1vdW50LCAxICksIGZhZGVJbkFtb3VudCwgMSApLCBzdHV0dGVyU2FtcGxlICkgKSxcbiAgICAgICAgZy5ndCggc3R1dHRlclBoYXNlLCBnLnN1YiggcmF0ZU9mU2h1ZmZsaW5nLCBmYWRlTGVuZ3RoICkgKSxcbiAgICAgICAgZy5tZW1vKCBnLm11bCggZy5ndHAoIGZhZGVPdXRBbW91bnQsIDAgKSwgc3R1dHRlclNhbXBsZSApICksXG4gICAgICAgIHN0dXR0ZXJTYW1wbGVcbiAgICAgIClcbiAgICAgIFxuICAgICAgbGV0IG91dHB1dEwgPSBnLm1peCggbm9ybWFsU2FtcGxlLCBmYWRlZFN0dXR0ZXIsIGlzU2h1ZmZsaW5nICkgXG5cbiAgICAgIGxldCBwb2tlTCA9IGcucG9rZSggYnVmZmVyTCwgbGVmdElucHV0LCBnLm1vZCggZy5hZGQoIHBoYXNlLCA0NDEwMCApLCA4ODIwMCApIClcblxuICAgICAgbGV0IHBhbm5lciA9IGcucGFuKCBvdXRwdXRMLCBvdXRwdXRMLCBnLmluKCAncGFuJyApIClcbiAgICAgIFxuICAgICAgYnVmZmVyU2h1ZmZsZXIuZ3JhcGggPSBbIHBhbm5lci5sZWZ0LCBwYW5uZXIucmlnaHQgXVxuICAgIH1cblxuICAgIGJ1ZmZlclNodWZmbGVyLl9fY3JlYXRlR3JhcGgoKVxuICAgIGJ1ZmZlclNodWZmbGVyLl9fcmVxdWlyZXNSZWNvbXBpbGF0aW9uID0gWyAnaW5wdXQnIF1cbiAgICBcbiAgICBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggXG4gICAgICBidWZmZXJTaHVmZmxlcixcbiAgICAgIGJ1ZmZlclNodWZmbGVyLmdyYXBoLFxuICAgICAgWydmeCcsJ3NodWZmbGVyJ10sIFxuICAgICAgcHJvcHMgXG4gICAgKVxuXG4gICAgcmV0dXJuIG91dCBcbiAgfVxuICBcbiAgU2h1ZmZsZXIuZGVmYXVsdHMgPSB7XG4gICAgaW5wdXQ6MCxcbiAgICByYXRlOjIyMDUwLFxuICAgIGNoYW5jZTouMjUsXG4gICAgcmV2ZXJzZUNoYW5jZTouNSxcbiAgICByZXBpdGNoQ2hhbmNlOi41LFxuICAgIHJlcGl0Y2hNaW46LjUsXG4gICAgcmVwaXRjaE1heDoyLFxuICAgIHBhbjouNSxcbiAgICBtaXg6LjVcbiAgfVxuXG4gIHJldHVybiBTaHVmZmxlciBcbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgZWZmZWN0ID0gcmVxdWlyZSggJy4vZWZmZWN0LmpzJyApXG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuIFxubGV0IF9fQ2hvcnVzID0gaW5wdXRQcm9wcyA9PiB7XG4gIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgX19DaG9ydXMuZGVmYXVsdHMsIGVmZmVjdC5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gIGxldCBvdXRcbiAgXG4gIGNvbnN0IGNob3J1cyA9IE9iamVjdC5jcmVhdGUoIGVmZmVjdCApXG5cbiAgY2hvcnVzLl9fY3JlYXRlR3JhcGggPSBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBpbnB1dCA9IGcuaW4oJ2lucHV0JyksXG4gICAgICAgICAgaW5wdXRHYWluID0gZy5pbiggJ2lucHV0R2FpbicgKSxcbiAgICAgICAgICBmcmVxMSA9IGcuaW4oJ3Nsb3dGcmVxdWVuY3knKSxcbiAgICAgICAgICBmcmVxMiA9IGcuaW4oJ2Zhc3RGcmVxdWVuY3knKSxcbiAgICAgICAgICBhbXAxICA9IGcuaW4oJ3Nsb3dHYWluJyksXG4gICAgICAgICAgYW1wMiAgPSBnLmluKCdmYXN0R2FpbicpXG5cbiAgICBsZXQgaXNTdGVyZW8gPSBmYWxzZVxuICAgIGlmKCBvdXQgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGlzU3RlcmVvID0gdHlwZW9mIHByb3BzLmlucHV0LmlzU3RlcmVvICE9PSAndW5kZWZpbmVkJyA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogZmFsc2UgXG4gICAgfWVsc2V7XG4gICAgICBpc1N0ZXJlbyA9IG91dC5pbnB1dC5pc1N0ZXJlb1xuICAgICAgb3V0LmlzU3RlcmVvID0gaXNTdGVyZW9cbiAgICB9XG5cbiAgICBjb25zdCBsZWZ0SW5wdXQgPSBpc1N0ZXJlbyA/IGcubXVsKCBpbnB1dFswXSwgaW5wdXRHYWluICkgOiBnLm11bCggaW5wdXQsIGlucHV0R2FpbiApXG5cbiAgICBjb25zdCB3aW4wICAgPSBnLmVudiggJ2ludmVyc2V3ZWxjaCcsIDEwMjQgKSxcbiAgICAgICAgICB3aW4xMjAgPSBnLmVudiggJ2ludmVyc2V3ZWxjaCcsIDEwMjQsIDAsIC4zMzMgKSxcbiAgICAgICAgICB3aW4yNDAgPSBnLmVudiggJ2ludmVyc2V3ZWxjaCcsIDEwMjQsIDAsIC42NjYgKVxuICAgIFxuICAgIGNvbnN0IHNsb3dQaGFzb3IgPSBnLnBoYXNvciggZnJlcTEsIDAsIHsgbWluOjAgfSksXG4gICAgICAgICAgc2xvd1BlZWsxICA9IGcubXVsKCBnLnBlZWsoIHdpbjAsICAgc2xvd1BoYXNvciApLCBhbXAxICksXG4gICAgICAgICAgc2xvd1BlZWsyICA9IGcubXVsKCBnLnBlZWsoIHdpbjEyMCwgc2xvd1BoYXNvciApLCBhbXAxICksXG4gICAgICAgICAgc2xvd1BlZWszICA9IGcubXVsKCBnLnBlZWsoIHdpbjI0MCwgc2xvd1BoYXNvciApLCBhbXAxIClcbiAgICBcbiAgICBjb25zdCBmYXN0UGhhc29yID0gZy5waGFzb3IoIGZyZXEyLCAwLCB7IG1pbjowIH0pLFxuICAgICAgICAgIGZhc3RQZWVrMSAgPSBnLm11bCggZy5wZWVrKCB3aW4wLCAgIGZhc3RQaGFzb3IgKSwgYW1wMiApLFxuICAgICAgICAgIGZhc3RQZWVrMiAgPSBnLm11bCggZy5wZWVrKCB3aW4xMjAsIGZhc3RQaGFzb3IgKSwgYW1wMiApLFxuICAgICAgICAgIGZhc3RQZWVrMyAgPSBnLm11bCggZy5wZWVrKCB3aW4yNDAsIGZhc3RQaGFzb3IgKSwgYW1wMiApXG5cblxuICAgIGxldCBzYW1wbGVSYXRlID0gR2liYmVyaXNoLmN0eC5zYW1wbGVSYXRlXG4gICAgIFxuICAgIGNvbnN0IG1zID0gc2FtcGxlUmF0ZSAvIDEwMDAgXG4gICAgY29uc3QgbWF4RGVsYXlUaW1lID0gMTAwMCAqIG1zXG5cbiAgICAvL2NvbnNvbGUubG9nKCAnc3I6Jywgc2FtcGxlUmF0ZSwgJ21zOicsIG1zLCAnbWF4RGVsYXlUaW1lOicsIG1heERlbGF5VGltZSApXG5cbiAgICBjb25zdCB0aW1lMSA9ICBnLm11bCggZy5hZGQoIHNsb3dQZWVrMSwgZmFzdFBlZWsxLCA1ICksIG1zICksXG4gICAgICAgICAgdGltZTIgPSAgZy5tdWwoIGcuYWRkKCBzbG93UGVlazIsIGZhc3RQZWVrMiwgNSApLCBtcyApLFxuICAgICAgICAgIHRpbWUzID0gIGcubXVsKCBnLmFkZCggc2xvd1BlZWszLCBmYXN0UGVlazMsIDUgKSwgbXMgKVxuXG4gICAgY29uc3QgZGVsYXkxTCA9IGcuZGVsYXkoIGxlZnRJbnB1dCwgdGltZTEsIHsgc2l6ZTptYXhEZWxheVRpbWUgfSksXG4gICAgICAgICAgZGVsYXkyTCA9IGcuZGVsYXkoIGxlZnRJbnB1dCwgdGltZTIsIHsgc2l6ZTptYXhEZWxheVRpbWUgfSksXG4gICAgICAgICAgZGVsYXkzTCA9IGcuZGVsYXkoIGxlZnRJbnB1dCwgdGltZTMsIHsgc2l6ZTptYXhEZWxheVRpbWUgfSlcblxuICAgIFxuICAgIGNvbnN0IGxlZnRPdXRwdXQgPSBnLmFkZCggZGVsYXkxTCwgZGVsYXkyTCwgZGVsYXkzTCApXG4gICAgaWYoIGlzU3RlcmVvICkge1xuICAgICAgY29uc3QgcmlnaHRJbnB1dCA9IGcubXVsKCBpbnB1dFsxXSwgaW5wdXRHYWluIClcbiAgICAgIGNvbnN0IGRlbGF5MVIgPSBnLmRlbGF5KHJpZ2h0SW5wdXQsIHRpbWUxLCB7IHNpemU6bWF4RGVsYXlUaW1lIH0pLFxuICAgICAgICAgICAgZGVsYXkyUiA9IGcuZGVsYXkocmlnaHRJbnB1dCwgdGltZTIsIHsgc2l6ZTptYXhEZWxheVRpbWUgfSksXG4gICAgICAgICAgICBkZWxheTNSID0gZy5kZWxheShyaWdodElucHV0LCB0aW1lMywgeyBzaXplOm1heERlbGF5VGltZSB9KVxuXG4gICAgICAvLyBmbGlwIGEgY291cGxlIGRlbGF5IGxpbmVzIGZvciBzdGVyZW8gZWZmZWN0P1xuICAgICAgY29uc3QgcmlnaHRPdXRwdXQgPSBnLmFkZCggZGVsYXkxUiwgZGVsYXkyTCwgZGVsYXkzUiApXG4gICAgICBjaG9ydXMuZ3JhcGggPSBbIGcuYWRkKCBkZWxheTFMLCBkZWxheTJSLCBkZWxheTNMKSwgcmlnaHRPdXRwdXQgXVxuICAgIH1lbHNle1xuICAgICAgY2hvcnVzLmdyYXBoID0gbGVmdE91dHB1dFxuICAgIH1cbiAgfVxuXG4gIGNob3J1cy5fX2NyZWF0ZUdyYXBoKClcbiAgY2hvcnVzLl9fcmVxdWlyZXNSZWNvbXBpbGF0aW9uID0gWyAnaW5wdXQnIF1cblxuICBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggY2hvcnVzLCBjaG9ydXMuZ3JhcGgsIFsnZngnLCdjaG9ydXMnXSwgcHJvcHMgKVxuXG4gIHJldHVybiBvdXQgXG59XG5cbl9fQ2hvcnVzLmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBzbG93RnJlcXVlbmN5OiAuMTgsXG4gIHNsb3dHYWluOjMsXG4gIGZhc3RGcmVxdWVuY3k6NixcbiAgZmFzdEdhaW46MSxcbiAgaW5wdXRHYWluOjFcbn1cblxucmV0dXJuIF9fQ2hvcnVzXG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCdnZW5pc2guanMnKSxcbiAgICAgIGVmZmVjdCA9IHJlcXVpcmUoJy4vZWZmZWN0LmpzJyk7XG5cbmNvbnN0IGdlbmlzaCA9IGc7XG5cblwidXNlIGpzZHNwXCI7XG5cbmNvbnN0IEFsbFBhc3NDaGFpbiA9IChpbjEsIGluMiwgaW4zKSA9PiB7XG4gIFwidXNlIGpzZHNwXCI7XG5cbiAgLyogaW4xID0gcHJlZGVsYXlfb3V0ICovXG4gIC8qIGluMiA9IGluZGlmZnVzaW9uMSAqL1xuICAvKiBpbjMgPSBpbmRpZmZ1c2lvbjIgKi9cblxuICBjb25zdCBzdWIxID0gZ2VuaXNoLnN1YihpbjEsIDApO1xuICBjb25zdCBkMSA9IGcuZGVsYXkoc3ViMSwgMTQyKTtcbiAgc3ViMS5pbnB1dHNbMV0gPSBnZW5pc2gubXVsKGQxLCBpbjIpO1xuICBjb25zdCBhcDFfb3V0ID0gZ2VuaXNoLmFkZChnZW5pc2gubXVsKHN1YjEsIGluMiksIGQxKTtcblxuICBjb25zdCBzdWIyID0gZ2VuaXNoLnN1YihhcDFfb3V0LCAwKTtcbiAgY29uc3QgZDIgPSBnLmRlbGF5KHN1YjIsIDEwNyk7XG4gIHN1YjIuaW5wdXRzWzFdID0gZ2VuaXNoLm11bChkMiwgaW4yKTtcbiAgY29uc3QgYXAyX291dCA9IGdlbmlzaC5hZGQoZ2VuaXNoLm11bChzdWIyLCBpbjIpLCBkMik7XG5cbiAgY29uc3Qgc3ViMyA9IGdlbmlzaC5zdWIoYXAyX291dCwgMCk7XG4gIGNvbnN0IGQzID0gZy5kZWxheShzdWIzLCAzNzkpO1xuICBzdWIzLmlucHV0c1sxXSA9IGdlbmlzaC5tdWwoZDMsIGluMyk7XG4gIGNvbnN0IGFwM19vdXQgPSBnZW5pc2guYWRkKGdlbmlzaC5tdWwoc3ViMywgaW4zKSwgZDMpO1xuXG4gIGNvbnN0IHN1YjQgPSBnZW5pc2guc3ViKGFwM19vdXQsIDApO1xuICBjb25zdCBkNCA9IGcuZGVsYXkoc3ViNCwgMjc3KTtcbiAgc3ViNC5pbnB1dHNbMV0gPSBnZW5pc2gubXVsKGQ0LCBpbjMpO1xuICBjb25zdCBhcDRfb3V0ID0gZ2VuaXNoLmFkZChnZW5pc2gubXVsKHN1YjQsIGluMyksIGQ0KTtcblxuICByZXR1cm4gYXA0X291dDtcbn07XG5cbi8qY29uc3QgdGFua19vdXRzID0gVGFuayggYXBfb3V0LCBkZWNheWRpZmZ1c2lvbjEsIGRlY2F5ZGlmZnVzaW9uMiwgZGFtcGluZywgZGVjYXkgKSovXG5jb25zdCBUYW5rID0gZnVuY3Rpb24gKGluMSwgaW4yLCBpbjMsIGluNCwgaW41KSB7XG4gIFwidXNlIGpzZHNwXCI7XG5cbiAgY29uc3Qgb3V0cyA9IFtbXSwgW10sIFtdLCBbXSwgW11dO1xuXG4gIC8qIExFRlQgQ0hBTk5FTCAqL1xuICBjb25zdCBsZWZ0U3RhcnQgPSBnZW5pc2guYWRkKGluMSwgMCk7XG4gIGNvbnN0IGRlbGF5SW5wdXQgPSBnZW5pc2guYWRkKGxlZnRTdGFydCwgMCk7XG4gIGNvbnN0IGRlbGF5MSA9IGcuZGVsYXkoZGVsYXlJbnB1dCwgW2dlbmlzaC5hZGQoZ2VuaXNoLm11bChnLmN5Y2xlKC4xKSwgMTYpLCA2NzIpXSwgeyBzaXplOiA2ODggfSk7XG4gIGRlbGF5SW5wdXQuaW5wdXRzWzFdID0gZ2VuaXNoLm11bChkZWxheTEsIGluMik7XG4gIGNvbnN0IGRlbGF5T3V0ID0gZ2VuaXNoLnN1YihkZWxheTEsIGdlbmlzaC5tdWwoZGVsYXlJbnB1dCwgaW4yKSk7XG5cbiAgY29uc3QgZGVsYXkyID0gZy5kZWxheShkZWxheU91dCwgWzQ0NTMsIDM1MywgMzYyNywgMTE5MF0pO1xuICBvdXRzWzNdLnB1c2goZ2VuaXNoLmFkZChkZWxheTIub3V0cHV0c1sxXSwgZGVsYXkyLm91dHB1dHNbMl0pKTtcbiAgb3V0c1syXS5wdXNoKGRlbGF5Mi5vdXRwdXRzWzNdKTtcblxuICBjb25zdCBteiA9IGcuaGlzdG9yeSgwKTtcbiAgY29uc3QgbWwgPSBnLm1peChkZWxheTIsIG16Lm91dCwgaW40KTtcbiAgbXouaW4obWwpO1xuXG4gIGNvbnN0IG1vdXQgPSBnZW5pc2gubXVsKG1sLCBpbjUpO1xuXG4gIGNvbnN0IHMxID0gZ2VuaXNoLnN1Yihtb3V0LCAwKTtcbiAgY29uc3QgZGVsYXkzID0gZy5kZWxheShzMSwgWzE4MDAsIDE4NywgMTIyOF0pO1xuICBvdXRzWzJdLnB1c2goZGVsYXkzLm91dHB1dHNbMV0pO1xuICBvdXRzWzRdLnB1c2goZGVsYXkzLm91dHB1dHNbMl0pO1xuICBzMS5pbnB1dHNbMV0gPSBnZW5pc2gubXVsKGRlbGF5MywgaW4zKTtcbiAgY29uc3QgbTIgPSBnZW5pc2gubXVsKHMxLCBpbjMpO1xuICBjb25zdCBkbDJfb3V0ID0gZ2VuaXNoLmFkZChkZWxheTMsIG0yKTtcblxuICBjb25zdCBkZWxheTQgPSBnLmRlbGF5KGRsMl9vdXQsIFszNzIwLCAxMDY2LCAyNjczXSk7XG4gIG91dHNbMl0ucHVzaChkZWxheTQub3V0cHV0c1sxXSk7XG4gIG91dHNbM10ucHVzaChkZWxheTQub3V0cHV0c1syXSk7XG5cbiAgLyogUklHSFQgQ0hBTk5FTCAqL1xuICBjb25zdCByaWdodFN0YXJ0ID0gZ2VuaXNoLmFkZChnZW5pc2gubXVsKGRlbGF5NCwgaW41KSwgaW4xKTtcbiAgY29uc3QgZGVsYXlJbnB1dFIgPSBnZW5pc2guYWRkKHJpZ2h0U3RhcnQsIDApO1xuICBjb25zdCBkZWxheTFSID0gZy5kZWxheShkZWxheUlucHV0UiwgZ2VuaXNoLmFkZChnZW5pc2gubXVsKGcuY3ljbGUoLjA3KSwgMTYpLCA5MDgpLCB7IHNpemU6IDkyNCB9KTtcbiAgZGVsYXlJbnB1dFIuaW5wdXRzWzFdID0gZ2VuaXNoLm11bChkZWxheTFSLCBpbjIpO1xuICBjb25zdCBkZWxheU91dFIgPSBnZW5pc2guc3ViKGRlbGF5MVIsIGdlbmlzaC5tdWwoZGVsYXlJbnB1dFIsIGluMikpO1xuXG4gIGNvbnN0IGRlbGF5MlIgPSBnLmRlbGF5KGRlbGF5T3V0UiwgWzQyMTcsIDI2NiwgMjk3NCwgMjExMV0pO1xuICBvdXRzWzFdLnB1c2goZ2VuaXNoLmFkZChkZWxheTJSLm91dHB1dHNbMV0sIGRlbGF5MlIub3V0cHV0c1syXSkpO1xuICBvdXRzWzRdLnB1c2goZGVsYXkyUi5vdXRwdXRzWzNdKTtcblxuICBjb25zdCBtelIgPSBnLmhpc3RvcnkoMCk7XG4gIGNvbnN0IG1sUiA9IGcubWl4KGRlbGF5MlIsIG16Ui5vdXQsIGluNCk7XG4gIG16Ui5pbihtbFIpO1xuXG4gIGNvbnN0IG1vdXRSID0gZ2VuaXNoLm11bChtbFIsIGluNSk7XG5cbiAgY29uc3QgczFSID0gZ2VuaXNoLnN1Yihtb3V0UiwgMCk7XG4gIGNvbnN0IGRlbGF5M1IgPSBnLmRlbGF5KHMxUiwgWzI2NTYsIDMzNSwgMTkxM10pO1xuICBvdXRzWzRdLnB1c2goZGVsYXkzUi5vdXRwdXRzWzFdKTtcbiAgb3V0c1syXS5wdXNoKGRlbGF5M1Iub3V0cHV0c1syXSk7XG4gIHMxUi5pbnB1dHNbMV0gPSBnZW5pc2gubXVsKGRlbGF5M1IsIGluMyk7XG4gIGNvbnN0IG0yUiA9IGdlbmlzaC5tdWwoczFSLCBpbjMpO1xuICBjb25zdCBkbDJfb3V0UiA9IGdlbmlzaC5hZGQoZGVsYXkzUiwgbTJSKTtcblxuICBjb25zdCBkZWxheTRSID0gZy5kZWxheShkbDJfb3V0UiwgWzMxNjMsIDEyMSwgMTk5Nl0pO1xuICBvdXRzWzRdLnB1c2goZGVsYXk0Lm91dHB1dHNbMV0pO1xuICBvdXRzWzFdLnB1c2goZGVsYXk0Lm91dHB1dHNbMl0pO1xuXG4gIGxlZnRTdGFydC5pbnB1dHNbMV0gPSBnZW5pc2gubXVsKGRlbGF5NFIsIGluNSk7XG5cbiAgb3V0c1sxXSA9IGcuYWRkKC4uLm91dHNbMV0pO1xuICBvdXRzWzJdID0gZy5hZGQoLi4ub3V0c1syXSk7XG4gIG91dHNbM10gPSBnLmFkZCguLi5vdXRzWzNdKTtcbiAgb3V0c1s0XSA9IGcuYWRkKC4uLm91dHNbNF0pO1xuICByZXR1cm4gb3V0cztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEdpYmJlcmlzaCkge1xuXG4gIGNvbnN0IFJldmVyYiA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgUmV2ZXJiLmRlZmF1bHRzLCBlZmZlY3QuZGVmYXVsdHMsIGlucHV0UHJvcHMpLFxuICAgICAgICAgIHJldmVyYiA9IE9iamVjdC5jcmVhdGUoZWZmZWN0KTtcblxuICAgIGxldCBvdXQ7XG5cbiAgICByZXZlcmIuX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBpc1N0ZXJlbyA9IGZhbHNlO1xuICAgICAgaWYgKG91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzU3RlcmVvID0gdHlwZW9mIHByb3BzLmlucHV0LmlzU3RlcmVvICE9PSAndW5kZWZpbmVkJyA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc1N0ZXJlbyA9IG91dC5pbnB1dC5pc1N0ZXJlbztcbiAgICAgICAgb3V0LmlzU3RlcmVvID0gaXNTdGVyZW87XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlucHV0ID0gZy5pbignaW5wdXQnKSxcbiAgICAgICAgICAgIGlucHV0R2FpbiA9IGcuaW4oJ2lucHV0R2FpbicpLFxuICAgICAgICAgICAgZGFtcGluZyA9IGcuaW4oJ2RhbXBpbmcnKSxcbiAgICAgICAgICAgIGRyeXdldCA9IGcuaW4oJ2RyeXdldCcpLFxuICAgICAgICAgICAgZGVjYXkgPSBnLmluKCdkZWNheScpLFxuICAgICAgICAgICAgcHJlZGVsYXkgPSBnLmluKCdwcmVkZWxheScpLFxuICAgICAgICAgICAgaW5iYW5kd2lkdGggPSBnLmluKCdpbmJhbmR3aWR0aCcpLFxuICAgICAgICAgICAgZGVjYXlkaWZmdXNpb24xID0gZy5pbignZGVjYXlkaWZmdXNpb24xJyksXG4gICAgICAgICAgICBkZWNheWRpZmZ1c2lvbjIgPSBnLmluKCdkZWNheWRpZmZ1c2lvbjInKSxcbiAgICAgICAgICAgIGluZGlmZnVzaW9uMSA9IGcuaW4oJ2luZGlmZnVzaW9uMScpLFxuICAgICAgICAgICAgaW5kaWZmdXNpb24yID0gZy5pbignaW5kaWZmdXNpb24yJyk7XG5cbiAgICAgIGNvbnN0IHN1bW1lZElucHV0ID0gaXNTdGVyZW8gPT09IHRydWUgPyBnLm11bChnLmFkZChpbnB1dFswXSwgaW5wdXRbMV0pLCBpbnB1dEdhaW4pIDogZy5tdWwoaW5wdXQsIGlucHV0R2Fpbik7XG4gICAgICB7XG4gICAgICAgICd1c2UganNkc3AnO1xuXG4gICAgICAgIC8vIGNhbGN1bGNhdGUgcHJlZGVsYXlcbiAgICAgICAgY29uc3QgcHJlZGVsYXlfc2FtcHMgPSBnLm1zdG9zYW1wcyhwcmVkZWxheSk7XG4gICAgICAgIGNvbnN0IHByZWRlbGF5X2RlbGF5ID0gZy5kZWxheShzdW1tZWRJbnB1dCwgcHJlZGVsYXlfc2FtcHMsIHsgc2l6ZTogNDQxMCB9KTtcbiAgICAgICAgY29uc3Qgel9wZCA9IGcuaGlzdG9yeSgwKTtcbiAgICAgICAgY29uc3QgbWl4MSA9IGcubWl4KHpfcGQub3V0LCBwcmVkZWxheV9kZWxheSwgaW5iYW5kd2lkdGgpO1xuICAgICAgICB6X3BkLmluKG1peDEpO1xuXG4gICAgICAgIGNvbnN0IHByZWRlbGF5X291dCA9IG1peDE7XG5cbiAgICAgICAgLy8gcnVuIGlucHV0ICsgcHJlZGVsYXkgdGhyb3VnaCBhbGwtcGFzcyBjaGFpblxuICAgICAgICBjb25zdCBhcF9vdXQgPSBBbGxQYXNzQ2hhaW4ocHJlZGVsYXlfb3V0LCBpbmRpZmZ1c2lvbjEsIGluZGlmZnVzaW9uMik7XG5cbiAgICAgICAgLy8gcnVuIGZpbHRlcmVkIHNpZ25hbCBpbnRvIFwidGFua1wiIG1vZGVsXG4gICAgICAgIGNvbnN0IHRhbmtfb3V0cyA9IFRhbmsoYXBfb3V0LCBkZWNheWRpZmZ1c2lvbjEsIGRlY2F5ZGlmZnVzaW9uMiwgZGFtcGluZywgZGVjYXkpO1xuXG4gICAgICAgIGNvbnN0IGxlZnRXZXQgPSBnZW5pc2gubXVsKGdlbmlzaC5zdWIodGFua19vdXRzWzFdLCB0YW5rX291dHNbMl0pLCAuNik7XG4gICAgICAgIGNvbnN0IHJpZ2h0V2V0ID0gZ2VuaXNoLm11bChnZW5pc2guc3ViKHRhbmtfb3V0c1szXSwgdGFua19vdXRzWzRdKSwgLjYpO1xuXG4gICAgICAgIC8vIG1peCB3ZXQgYW5kIGRyeSBzaWduYWwgZm9yIGZpbmFsIG91dHB1dFxuICAgICAgICBjb25zdCBsZWZ0ID0gZy5taXgoaXNTdGVyZW8gPyBnLm11bChpbnB1dFswXSwgaW5wdXRHYWluKSA6IGcubXVsKGlucHV0LCBpbnB1dEdhaW4pLCBsZWZ0V2V0LCBkcnl3ZXQpO1xuICAgICAgICBjb25zdCByaWdodCA9IGcubWl4KGlzU3RlcmVvID8gZy5tdWwoaW5wdXRbMV0sIGlucHV0R2FpbikgOiBnLm11bChpbnB1dCwgaW5wdXRHYWluKSwgcmlnaHRXZXQsIGRyeXdldCk7XG5cbiAgICAgICAgcmV2ZXJiLmdyYXBoID0gW2xlZnQsIHJpZ2h0XTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV2ZXJiLl9fY3JlYXRlR3JhcGgoKTtcbiAgICByZXZlcmIuX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbJ2lucHV0J107XG5cbiAgICBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeShyZXZlcmIsIHJldmVyYi5ncmFwaCwgWydmeCcsICdwbGF0ZSddLCBwcm9wcyk7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIFJldmVyYi5kZWZhdWx0cyA9IHtcbiAgICBpbnB1dDogMCxcbiAgICBkYW1waW5nOiAuNSxcbiAgICBkcnl3ZXQ6IC41LFxuICAgIGRlY2F5OiAuNSxcbiAgICBwcmVkZWxheTogMTAsXG4gICAgaW5iYW5kd2lkdGg6IC41LFxuICAgIGluZGlmZnVzaW9uMTogLjc1LFxuICAgIGluZGlmZnVzaW9uMjogLjYyNSxcbiAgICBkZWNheWRpZmZ1c2lvbjE6IC43LFxuICAgIGRlY2F5ZGlmZnVzaW9uMjogLjVcbiAgfTtcblxuICByZXR1cm4gUmV2ZXJiO1xufTsiLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgZWZmZWN0ID0gcmVxdWlyZSggJy4vZWZmZWN0LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcbiBcbmxldCBEZWxheSA9IGlucHV0UHJvcHMgPT4ge1xuICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7IGRlbGF5TGVuZ3RoOiA0NDEwMCB9LCBlZmZlY3QuZGVmYXVsdHMsIERlbGF5LmRlZmF1bHRzLCBpbnB1dFByb3BzICksXG4gICAgICBkZWxheSA9IE9iamVjdC5jcmVhdGUoIGVmZmVjdCApXG5cbiAgbGV0IG91dFxuICBkZWxheS5fX2NyZWF0ZUdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlzU3RlcmVvID0gZmFsc2VcbiAgICBpZiggb3V0ID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBpc1N0ZXJlbyA9IHR5cGVvZiBwcm9wcy5pbnB1dC5pc1N0ZXJlbyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9wcy5pbnB1dC5pc1N0ZXJlbyA6IGZhbHNlIFxuICAgIH1lbHNle1xuICAgICAgaXNTdGVyZW8gPSBvdXQuaW5wdXQuaXNTdGVyZW9cbiAgICAgIG91dC5pc1N0ZXJlbyA9IGlzU3RlcmVvXG4gICAgfSAgICBcblxuICAgIGNvbnN0IGlucHV0ICAgICAgPSBnLmluKCAnaW5wdXQnICksXG4gICAgICAgICAgaW5wdXRHYWluICA9IGcuaW4oICdpbnB1dEdhaW4nICksXG4gICAgICAgICAgZGVsYXlUaW1lICA9IGcuaW4oICd0aW1lJyApLFxuICAgICAgICAgIHdldGRyeSAgICAgPSBnLmluKCAnd2V0ZHJ5JyApLFxuICAgICAgICAgIGxlZnRJbnB1dCAgPSBpc1N0ZXJlbyA/IGcubXVsKCBpbnB1dFsgMCBdLCBpbnB1dEdhaW4gKSA6IGcubXVsKCBpbnB1dCwgaW5wdXRHYWluICksXG4gICAgICAgICAgcmlnaHRJbnB1dCA9IGlzU3RlcmVvID8gZy5tdWwoIGlucHV0WyAxIF0sIGlucHV0R2FpbiApIDogbnVsbFxuICAgICAgXG4gICAgY29uc3QgZmVlZGJhY2sgPSBnLmluKCAnZmVlZGJhY2snIClcblxuICAgIC8vIGxlZnQgY2hhbm5lbFxuICAgIGNvbnN0IGZlZWRiYWNrSGlzdG9yeUwgPSBnLmhpc3RvcnkoKVxuICAgIGNvbnN0IGVjaG9MID0gZy5kZWxheSggZy5hZGQoIGxlZnRJbnB1dCwgZy5tdWwoIGZlZWRiYWNrSGlzdG9yeUwub3V0LCBmZWVkYmFjayApICksIGRlbGF5VGltZSwgeyBzaXplOnByb3BzLmRlbGF5TGVuZ3RoIH0pXG4gICAgZmVlZGJhY2tIaXN0b3J5TC5pbiggZWNob0wgKVxuICAgIGNvbnN0IGxlZnQgPSBnLm1peCggbGVmdElucHV0LCBlY2hvTCwgd2V0ZHJ5IClcblxuICAgIGlmKCBpc1N0ZXJlbyApIHtcbiAgICAgIC8vIHJpZ2h0IGNoYW5uZWxcbiAgICAgIGNvbnN0IGZlZWRiYWNrSGlzdG9yeVIgPSBnLmhpc3RvcnkoKVxuICAgICAgY29uc3QgZWNob1IgPSBnLmRlbGF5KCBnLmFkZCggcmlnaHRJbnB1dCwgZy5tdWwoIGZlZWRiYWNrSGlzdG9yeVIub3V0LCBmZWVkYmFjayApICksIGRlbGF5VGltZSwgeyBzaXplOnByb3BzLmRlbGF5TGVuZ3RoIH0pXG4gICAgICBmZWVkYmFja0hpc3RvcnlSLmluKCBlY2hvUiApXG4gICAgICBjb25zdCByaWdodCA9IGcubWl4KCByaWdodElucHV0LCBlY2hvUiwgd2V0ZHJ5IClcblxuICAgICAgZGVsYXkuZ3JhcGggPSBbIGxlZnQsIHJpZ2h0IF1cbiAgICB9ZWxzZXtcbiAgICAgIGRlbGF5LmdyYXBoID0gbGVmdCBcbiAgICB9XG4gIH1cblxuICBkZWxheS5fX2NyZWF0ZUdyYXBoKClcbiAgZGVsYXkuX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbICdpbnB1dCcgXVxuICBcbiAgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgIGRlbGF5LFxuICAgIGRlbGF5LmdyYXBoLCBcbiAgICBbJ2Z4JywnZGVsYXknXSwgXG4gICAgcHJvcHMgXG4gIClcblxuICByZXR1cm4gb3V0XG59XG5cbkRlbGF5LmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBmZWVkYmFjazouNSxcbiAgdGltZTogMTEwMjUsXG4gIHdldGRyeTogLjVcbn1cblxucmV0dXJuIERlbGF5XG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCdnZW5pc2guanMnKSxcbiAgICAgIGVmZmVjdCA9IHJlcXVpcmUoJy4vZWZmZWN0LmpzJyk7XG5cbmNvbnN0IGdlbmlzaCA9IGc7XG5cbi8qXG5cbiAgICAgICAgIGV4cChhc2lnICogKHNoYXBlMSArIHByZWdhaW4pKSAtIGV4cChhc2lnICogKHNoYXBlMiAtIHByZWdhaW4pKVxuICBhb3V0ID0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICBleHAoYXNpZyAqIHByZWdhaW4pICAgICAgICAgICAgKyBleHAoLWFzaWcgKiBwcmVnYWluKVxuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChHaWJiZXJpc2gpIHtcblxuICBsZXQgRGlzdG9ydGlvbiA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGxldCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIGVmZmVjdC5kZWZhdWx0cywgRGlzdG9ydGlvbi5kZWZhdWx0cywgaW5wdXRQcm9wcyksXG4gICAgICAgIGRpc3RvcnRpb24gPSBPYmplY3QuY3JlYXRlKGVmZmVjdCksXG4gICAgICAgIG91dDtcblxuICAgIGRpc3RvcnRpb24uX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGxldCBpc1N0ZXJlbyA9IGZhbHNlO1xuICAgICAgaWYgKG91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzU3RlcmVvID0gdHlwZW9mIHByb3BzLmlucHV0LmlzU3RlcmVvICE9PSAndW5kZWZpbmVkJyA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc1N0ZXJlbyA9IG91dC5pbnB1dC5pc1N0ZXJlbztcbiAgICAgICAgb3V0LmlzU3RlcmVvID0gaXNTdGVyZW87XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlucHV0ID0gZy5pbignaW5wdXQnKSxcbiAgICAgICAgICAgIGlucHV0R2FpbiA9IGcuaW4oJ2lucHV0R2FpbicpLFxuICAgICAgICAgICAgc2hhcGUxID0gZy5pbignc2hhcGUxJyksXG4gICAgICAgICAgICBzaGFwZTIgPSBnLmluKCdzaGFwZTInKSxcbiAgICAgICAgICAgIHByZWdhaW4gPSBnLmluKCdwcmVnYWluJyksXG4gICAgICAgICAgICBwb3N0Z2FpbiA9IGcuaW4oJ3Bvc3RnYWluJyk7XG5cbiAgICAgIGxldCBsb3V0O1xuICAgICAge1xuICAgICAgICAndXNlIGpzZHNwJztcbiAgICAgICAgY29uc3QgbGlucHV0ID0gaXNTdGVyZW8gPyBnLm11bChpbnB1dFswXSwgaW5wdXRHYWluKSA6IGcubXVsKGlucHV0LCBpbnB1dEdhaW4pO1xuICAgICAgICBjb25zdCBsdG9wID0gZ2VuaXNoLnN1YihnLmV4cChnZW5pc2gubXVsKGxpbnB1dCwgZ2VuaXNoLmFkZChzaGFwZTEsIHByZWdhaW4pKSksIGcuZXhwKGdlbmlzaC5tdWwobGlucHV0LCBnZW5pc2guc3ViKHNoYXBlMiwgcHJlZ2FpbikpKSk7XG4gICAgICAgIGNvbnN0IGxib3R0b20gPSBnZW5pc2guYWRkKGcuZXhwKGdlbmlzaC5tdWwobGlucHV0LCBwcmVnYWluKSksIGcuZXhwKGdlbmlzaC5tdWwoZ2VuaXNoLm11bCgtMSwgbGlucHV0KSwgcHJlZ2FpbikpKTtcbiAgICAgICAgbG91dCA9IGdlbmlzaC5tdWwoZ2VuaXNoLmRpdihsdG9wLCBsYm90dG9tKSwgcG9zdGdhaW4pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNTdGVyZW8pIHtcbiAgICAgICAgbGV0IHJvdXQ7XG4gICAgICAgIHtcbiAgICAgICAgICAndXNlIGpzZHNwJztcbiAgICAgICAgICBjb25zdCByaW5wdXQgPSBpc1N0ZXJlbyA/IGcubXVsKGlucHV0WzFdLCBpbnB1dEdhaW4pIDogZy5tdWwoaW5wdXQsIGlucHV0R2Fpbik7XG4gICAgICAgICAgY29uc3QgcnRvcCA9IGdlbmlzaC5zdWIoZy5leHAoZ2VuaXNoLm11bChyaW5wdXQsIGdlbmlzaC5hZGQoc2hhcGUxLCBwcmVnYWluKSkpLCBnLmV4cChnZW5pc2gubXVsKHJpbnB1dCwgZ2VuaXNoLnN1YihzaGFwZTIsIHByZWdhaW4pKSkpO1xuICAgICAgICAgIGNvbnN0IHJib3R0b20gPSBnZW5pc2guYWRkKGcuZXhwKGdlbmlzaC5tdWwocmlucHV0LCBwcmVnYWluKSksIGcuZXhwKGdlbmlzaC5tdWwoZ2VuaXNoLm11bCgtMSwgcmlucHV0KSwgcHJlZ2FpbikpKTtcbiAgICAgICAgICByb3V0ID0gZ2VuaXNoLm11bChnZW5pc2guZGl2KHJ0b3AsIHJib3R0b20pLCBwb3N0Z2Fpbik7XG4gICAgICAgIH1cblxuICAgICAgICBkaXN0b3J0aW9uLmdyYXBoID0gW2xvdXQsIHJvdXRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzdG9ydGlvbi5ncmFwaCA9IGxvdXQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGRpc3RvcnRpb24uX19jcmVhdGVHcmFwaCgpO1xuICAgIGRpc3RvcnRpb24uX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbJ2lucHV0J107XG5cbiAgICBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeShkaXN0b3J0aW9uLCBkaXN0b3J0aW9uLmdyYXBoLCBbJ2Z4JywgJ2Rpc3RvcnRpb24nXSwgcHJvcHMpO1xuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgRGlzdG9ydGlvbi5kZWZhdWx0cyA9IHtcbiAgICBpbnB1dDogMCxcbiAgICBzaGFwZTE6IC4xLFxuICAgIHNoYXBlMjogLjEsXG4gICAgcHJlZ2FpbjogNSxcbiAgICBwb3N0Z2FpbjogLjVcbiAgfTtcblxuICByZXR1cm4gRGlzdG9ydGlvbjtcbn07IiwibGV0IHVnZW4gPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKSgpXG5cbmxldCBlZmZlY3QgPSBPYmplY3QuY3JlYXRlKCB1Z2VuIClcblxuT2JqZWN0LmFzc2lnbiggZWZmZWN0LCB7XG4gIGRlZmF1bHRzOiB7IGJ5cGFzczpmYWxzZSwgaW5wdXRHYWluOjEgfSxcbiAgdHlwZTonZWZmZWN0J1xufSlcblxubW9kdWxlLmV4cG9ydHMgPSBlZmZlY3RcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuICBjb25zdCBlZmZlY3RzID0ge1xuICAgIEZyZWV2ZXJiICAgIDogcmVxdWlyZSggJy4vZnJlZXZlcmIuanMnICApKCBHaWJiZXJpc2ggKSxcbiAgICBQbGF0ZSAgICAgICA6IHJlcXVpcmUoICcuL2RhdHRvcnJvLmpzJyAgKSggR2liYmVyaXNoICksXG4gICAgRmxhbmdlciAgICAgOiByZXF1aXJlKCAnLi9mbGFuZ2VyLmpzJyAgICkoIEdpYmJlcmlzaCApLFxuICAgIFZpYnJhdG8gICAgIDogcmVxdWlyZSggJy4vdmlicmF0by5qcycgICApKCBHaWJiZXJpc2ggKSxcbiAgICBEZWxheSAgICAgICA6IHJlcXVpcmUoICcuL2RlbGF5LmpzJyAgICAgKSggR2liYmVyaXNoICksXG4gICAgQml0Q3J1c2hlciAgOiByZXF1aXJlKCAnLi9iaXRDcnVzaGVyLmpzJykoIEdpYmJlcmlzaCApLFxuICAgIERpc3RvcnRpb24gIDogcmVxdWlyZSggJy4vZGlzdG9ydGlvbi5qcycpKCBHaWJiZXJpc2ggKSxcbiAgICBSaW5nTW9kICAgICA6IHJlcXVpcmUoICcuL3JpbmdNb2QuanMnICAgKSggR2liYmVyaXNoICksXG4gICAgVHJlbW9sbyAgICAgOiByZXF1aXJlKCAnLi90cmVtb2xvLmpzJyAgICkoIEdpYmJlcmlzaCApLFxuICAgIENob3J1cyAgICAgIDogcmVxdWlyZSggJy4vY2hvcnVzLmpzJyAgICApKCBHaWJiZXJpc2ggKSxcbiAgICBTaHVmZmxlciAgICA6IHJlcXVpcmUoICcuL2J1ZmZlclNodWZmbGVyLmpzJyAgKSggR2liYmVyaXNoICksXG4gICAgLy9HYXRlICAgICAgICA6IHJlcXVpcmUoICcuL2dhdGUuanMnICAgICAgKSggR2liYmVyaXNoICksXG4gIH1cblxuICBlZmZlY3RzLmV4cG9ydCA9IHRhcmdldCA9PiB7XG4gICAgZm9yKCBsZXQga2V5IGluIGVmZmVjdHMgKSB7XG4gICAgICBpZigga2V5ICE9PSAnZXhwb3J0JyApIHtcbiAgICAgICAgdGFyZ2V0WyBrZXkgXSA9IGVmZmVjdHNbIGtleSBdXG4gICAgICB9XG4gICAgfVxuICB9XG5cbnJldHVybiBlZmZlY3RzXG5cbn1cbiIsImxldCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICBwcm90byA9IHJlcXVpcmUoICcuL2VmZmVjdC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gXG5sZXQgRmxhbmdlciA9IGlucHV0UHJvcHMgPT4ge1xuICBsZXQgcHJvcHMgICA9IE9iamVjdC5hc3NpZ24oIHsgZGVsYXlMZW5ndGg6NDQxMDAgfSwgRmxhbmdlci5kZWZhdWx0cywgcHJvdG8uZGVmYXVsdHMsIGlucHV0UHJvcHMgKSxcbiAgICAgIGZsYW5nZXIgPSBPYmplY3QuY3JlYXRlKCBwcm90byApLFxuICAgICAgb3V0XG5cbiAgZmxhbmdlci5fX2NyZWF0ZUdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlzU3RlcmVvID0gZmFsc2VcbiAgICBpZiggb3V0ID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBpc1N0ZXJlbyA9IHR5cGVvZiBwcm9wcy5pbnB1dC5pc1N0ZXJlbyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9wcy5pbnB1dC5pc1N0ZXJlbyA6IGZhbHNlIFxuICAgIH1lbHNle1xuICAgICAgaXNTdGVyZW8gPSBvdXQuaW5wdXQuaXNTdGVyZW9cbiAgICAgIG91dC5pc1N0ZXJlbyA9IGlzU3RlcmVvXG4gICAgfVxuXG4gICAgY29uc3QgaW5wdXQgPSBnLmluKCAnaW5wdXQnICksXG4gICAgICAgICAgaW5wdXRHYWluID0gZy5pbiggJ2lucHV0R2FpbicgKSxcbiAgICAgICAgICBkZWxheUxlbmd0aCA9IHByb3BzLmRlbGF5TGVuZ3RoLFxuICAgICAgICAgIGZlZWRiYWNrQ29lZmYgPSBnLmluKCAnZmVlZGJhY2snICksXG4gICAgICAgICAgbW9kQW1vdW50ID0gZy5pbiggJ29mZnNldCcgKSxcbiAgICAgICAgICBmcmVxdWVuY3kgPSBnLmluKCAnZnJlcXVlbmN5JyApLFxuICAgICAgICAgIGRlbGF5QnVmZmVyTCA9IGcuZGF0YSggZGVsYXlMZW5ndGggKVxuXG4gICAgY29uc3Qgd3JpdGVJZHggPSBnLmFjY3VtKCAxLDAsIHsgbWluOjAsIG1heDpkZWxheUxlbmd0aCwgaW50ZXJwOidub25lJywgbW9kZTonc2FtcGxlcycgfSlcbiAgICBcbiAgICBjb25zdCBvZmZzZXQgPSBnLm11bCggbW9kQW1vdW50LCA1MDAgKVxuXG4gICAgY29uc3QgbW9kID0gcHJvcHMubW9kID09PSB1bmRlZmluZWQgPyBnLmN5Y2xlKCBmcmVxdWVuY3kgKSA6IHByb3BzLm1vZFxuICAgIFxuICAgIGNvbnN0IHJlYWRJZHggPSBnLndyYXAoIFxuICAgICAgZy5hZGQoIFxuICAgICAgICBnLnN1Yiggd3JpdGVJZHgsIG9mZnNldCApLCBcbiAgICAgICAgbW9kLy9nLm11bCggbW9kLCBnLnN1Yiggb2Zmc2V0LCAxICkgKSBcbiAgICAgICksIFxuICAgICAgMCwgXG4gICAgICBkZWxheUxlbmd0aFxuICAgIClcblxuICAgIGNvbnN0IGxlZnRJbnB1dCA9IGlzU3RlcmVvID8gaW5wdXRbMF0gOiBpbnB1dFxuXG4gICAgY29uc3QgZGVsYXllZE91dEwgPSBnLnBlZWsoIGRlbGF5QnVmZmVyTCwgcmVhZElkeCwgeyBpbnRlcnA6J2xpbmVhcicsIG1vZGU6J3NhbXBsZXMnIH0pXG4gICAgXG4gICAgZy5wb2tlKCBkZWxheUJ1ZmZlckwsIGcuYWRkKCBsZWZ0SW5wdXQsIGcubXVsKCBkZWxheWVkT3V0TCwgZmVlZGJhY2tDb2VmZiApICksIHdyaXRlSWR4IClcblxuICAgIGNvbnN0IGxlZnQgPSBnLmFkZCggbGVmdElucHV0LCBkZWxheWVkT3V0TCApXG5cbiAgICBpZiggaXNTdGVyZW8gPT09IHRydWUgKSB7XG4gICAgICBjb25zdCByaWdodElucHV0ID0gaW5wdXRbMV1cbiAgICAgIGNvbnN0IGRlbGF5QnVmZmVyUiA9IGcuZGF0YSggZGVsYXlMZW5ndGggKVxuICAgICAgXG4gICAgICBsZXQgZGVsYXllZE91dFIgPSBnLnBlZWsoIGRlbGF5QnVmZmVyUiwgcmVhZElkeCwgeyBpbnRlcnA6J2xpbmVhcicsIG1vZGU6J3NhbXBsZXMnIH0pXG5cbiAgICAgIGcucG9rZSggZGVsYXlCdWZmZXJSLCBnLmFkZCggcmlnaHRJbnB1dCwgZy5tdWwoIGRlbGF5ZWRPdXRSLCBmZWVkYmFja0NvZWZmICkgKSwgd3JpdGVJZHggKVxuICAgICAgY29uc3QgcmlnaHQgPSBnLmFkZCggcmlnaHRJbnB1dCwgZGVsYXllZE91dFIgKVxuXG4gICAgICBmbGFuZ2VyLmdyYXBoID0gWyBsZWZ0LCByaWdodCBdXG5cbiAgICB9ZWxzZXtcbiAgICAgIGZsYW5nZXIuZ3JhcGggPSBsZWZ0XG4gICAgfVxuICB9XG5cbiAgZmxhbmdlci5fX2NyZWF0ZUdyYXBoKClcbiAgZmxhbmdlci5fX3JlcXVpcmVzUmVjb21waWxhdGlvbiA9IFsgJ2lucHV0JyBdXG5cbiAgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgIGZsYW5nZXIsXG4gICAgZmxhbmdlci5ncmFwaCwgXG4gICAgWydmeCcsJ2ZsYW5nZXInXSwgXG4gICAgcHJvcHMgXG4gICkgXG5cbiAgcmV0dXJuIG91dCBcbn1cblxuRmxhbmdlci5kZWZhdWx0cyA9IHtcbiAgaW5wdXQ6MCxcbiAgZmVlZGJhY2s6LjAxLFxuICBvZmZzZXQ6LjI1LFxuICBmcmVxdWVuY3k6LjVcbn1cblxucmV0dXJuIEZsYW5nZXJcblxufVxuIiwiY29uc3QgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgICBlZmZlY3QgPSByZXF1aXJlKCAnLi9lZmZlY3QuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuICBcbmNvbnN0IGFsbFBhc3MgPSBHaWJiZXJpc2guZmlsdGVycy5nZW5pc2guQWxsUGFzc1xuY29uc3QgY29tYkZpbHRlciA9IEdpYmJlcmlzaC5maWx0ZXJzLmdlbmlzaC5Db21iXG5cbmNvbnN0IHR1bmluZyA9IHtcbiAgY29tYkNvdW50Olx0ICBcdDgsXG4gIGNvbWJUdW5pbmc6IFx0XHRbIDExMTYsIDExODgsIDEyNzcsIDEzNTYsIDE0MjIsIDE0OTEsIDE1NTcsIDE2MTcgXSwgICAgICAgICAgICAgICAgICAgIFxuICBhbGxQYXNzQ291bnQ6IFx0NCxcbiAgYWxsUGFzc1R1bmluZzpcdFsgMjI1LCA1NTYsIDQ0MSwgMzQxIF0sXG4gIGFsbFBhc3NGZWVkYmFjazowLjUsXG4gIGZpeGVkR2FpbjogXHRcdCAgMC4wMTUsXG4gIHNjYWxlRGFtcGluZzogXHQwLjQsXG4gIHNjYWxlUm9vbTogXHRcdCAgMC4yOCxcbiAgb2Zmc2V0Um9vbTogXHQgIDAuNyxcbiAgc3RlcmVvU3ByZWFkOiAgIDIzXG59XG5cbmNvbnN0IEZyZWV2ZXJiID0gaW5wdXRQcm9wcyA9PiB7XG4gIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbigge30sIGVmZmVjdC5kZWZhdWx0cywgRnJlZXZlcmIuZGVmYXVsdHMsIGlucHV0UHJvcHMgKSxcbiAgICAgICAgcmV2ZXJiID0gT2JqZWN0LmNyZWF0ZSggZWZmZWN0ICkgXG5cbiAgbGV0IG91dCBcbiAgcmV2ZXJiLl9fY3JlYXRlR3JhcGggPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgaXNTdGVyZW8gPSBmYWxzZVxuICAgIGlmKCBvdXQgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGlzU3RlcmVvID0gdHlwZW9mIHByb3BzLmlucHV0LmlzU3RlcmVvICE9PSAndW5kZWZpbmVkJyA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogZmFsc2UgXG4gICAgfWVsc2V7XG4gICAgICBpc1N0ZXJlbyA9IG91dC5pbnB1dC5pc1N0ZXJlb1xuICAgIH0gICAgXG5cbiAgICBjb25zdCBjb21ic0wgPSBbXSwgY29tYnNSID0gW11cblxuICAgIGNvbnN0IGlucHV0ID0gZy5pbiggJ2lucHV0JyApLFxuICAgICAgICAgIGlucHV0R2FpbiA9IGcuaW4oICdpbnB1dEdhaW4nICksXG4gICAgICAgICAgd2V0MSA9IGcuaW4oICd3ZXQxJyksXG4gICAgICAgICAgd2V0MiA9IGcuaW4oICd3ZXQyJyApLCAgXG4gICAgICAgICAgZHJ5ID0gZy5pbiggJ2RyeScgKSwgXG4gICAgICAgICAgcm9vbVNpemUgPSBnLmluKCAncm9vbVNpemUnICksIFxuICAgICAgICAgIGRhbXBpbmcgPSBnLmluKCAnZGFtcGluZycgKVxuICAgIFxuICAgIGNvbnN0IF9fc3VtbWVkSW5wdXQgPSBpc1N0ZXJlbyA9PT0gdHJ1ZSA/IGcuYWRkKCBpbnB1dFswXSwgaW5wdXRbMV0gKSA6IGlucHV0LFxuICAgICAgICAgc3VtbWVkSW5wdXQgPSBnLm11bCggX19zdW1tZWRJbnB1dCwgaW5wdXRHYWluICksXG4gICAgICAgICBhdHRlbnVhdGVkSW5wdXQgPSBnLm1lbW8oIGcubXVsKCBzdW1tZWRJbnB1dCwgdHVuaW5nLmZpeGVkR2FpbiApIClcbiAgICBcbiAgICAvLyBjcmVhdGUgY29tYiBmaWx0ZXJzIGluIHBhcmFsbGVsLi4uXG4gICAgZm9yKCBsZXQgaSA9IDA7IGkgPCA4OyBpKysgKSB7IFxuICAgICAgY29tYnNMLnB1c2goIFxuICAgICAgICBjb21iRmlsdGVyKCBcbiAgICAgICAgICBhdHRlbnVhdGVkSW5wdXQsIFxuICAgICAgICAgIHR1bmluZy5jb21iVHVuaW5nW2ldLCBcbiAgICAgICAgICBnLm11bChkYW1waW5nLC40KSxcbiAgICAgICAgICBnLm11bCggdHVuaW5nLnNjYWxlUm9vbSArIHR1bmluZy5vZmZzZXRSb29tLCByb29tU2l6ZSApIFxuICAgICAgICApIFxuICAgICAgKVxuICAgICAgY29tYnNSLnB1c2goIFxuICAgICAgICBjb21iRmlsdGVyKCBcbiAgICAgICAgICBhdHRlbnVhdGVkSW5wdXQsIFxuICAgICAgICAgIHR1bmluZy5jb21iVHVuaW5nW2ldICsgdHVuaW5nLnN0ZXJlb1NwcmVhZCwgXG4gICAgICAgICAgZy5tdWwoZGFtcGluZywuNCksIFxuICAgICAgICAgIGcubXVsKCB0dW5pbmcuc2NhbGVSb29tICsgdHVuaW5nLm9mZnNldFJvb20sIHJvb21TaXplICkgXG4gICAgICAgICkgXG4gICAgICApXG4gICAgfVxuICAgIFxuICAgIC8vIC4uLiBhbmQgc3VtIHRoZW0gd2l0aCBhdHRlbnVhdGVkIGlucHV0LCB1c2Ugb2YgbGV0IGlzIGRlbGliZXJhdGUgaGVyZVxuICAgIGxldCBvdXRMID0gZy5hZGQoIGF0dGVudWF0ZWRJbnB1dCwgLi4uY29tYnNMIClcbiAgICBsZXQgb3V0UiA9IGcuYWRkKCBhdHRlbnVhdGVkSW5wdXQsIC4uLmNvbWJzUiApXG4gICAgXG4gICAgLy8gcnVuIHRocm91Z2ggYWxscGFzcyBmaWx0ZXJzIGluIHNlcmllc1xuICAgIGZvciggbGV0IGkgPSAwOyBpIDwgNDsgaSsrICkgeyBcbiAgICAgIG91dEwgPSBhbGxQYXNzKCBvdXRMLCB0dW5pbmcuYWxsUGFzc1R1bmluZ1sgaSBdICsgdHVuaW5nLnN0ZXJlb1NwcmVhZCApXG4gICAgICBvdXRSID0gYWxsUGFzcyggb3V0UiwgdHVuaW5nLmFsbFBhc3NUdW5pbmdbIGkgXSArIHR1bmluZy5zdGVyZW9TcHJlYWQgKVxuICAgIH1cbiAgICBcbiAgICBjb25zdCBvdXRwdXRMID0gZy5hZGQoIGcubXVsKCBvdXRMLCB3ZXQxICksIGcubXVsKCBvdXRSLCB3ZXQyICksIGcubXVsKCBpc1N0ZXJlbyA9PT0gdHJ1ZSA/IGlucHV0WzBdIDogaW5wdXQsIGRyeSApICksXG4gICAgICAgICAgb3V0cHV0UiA9IGcuYWRkKCBnLm11bCggb3V0Uiwgd2V0MSApLCBnLm11bCggb3V0TCwgd2V0MiApLCBnLm11bCggaXNTdGVyZW8gPT09IHRydWUgPyBpbnB1dFsxXSA6IGlucHV0LCBkcnkgKSApXG5cbiAgICByZXZlcmIuZ3JhcGggPSBbIG91dHB1dEwsIG91dHB1dFIgXVxuICB9XG5cbiAgcmV2ZXJiLl9fY3JlYXRlR3JhcGgoKVxuICByZXZlcmIuX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbICdpbnB1dCcgXVxuXG4gIG91dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCByZXZlcmIsIHJldmVyYi5ncmFwaCwgWydmeCcsJ2ZyZWV2ZXJiJ10sIHByb3BzIClcblxuICByZXR1cm4gb3V0XG59XG5cblxuRnJlZXZlcmIuZGVmYXVsdHMgPSB7XG4gIGlucHV0OiAwLFxuICB3ZXQxOiAxLFxuICB3ZXQyOiAwLFxuICBkcnk6IC41LFxuICByb29tU2l6ZTogLjkyNSxcbiAgZGFtcGluZzogIC41LFxufVxuXG5yZXR1cm4gRnJlZXZlcmIgXG5cbn1cblxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgIGVmZmVjdCA9IHJlcXVpcmUoICcuL2VmZmVjdC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gXG5sZXQgUmluZ01vZCA9IGlucHV0UHJvcHMgPT4ge1xuICBsZXQgcHJvcHMgICA9IE9iamVjdC5hc3NpZ24oIHt9LCBSaW5nTW9kLmRlZmF1bHRzLCBlZmZlY3QuZGVmYXVsdHMsIGlucHV0UHJvcHMgKSxcbiAgICAgIHJpbmdNb2QgPSBPYmplY3QuY3JlYXRlKCBlZmZlY3QgKSxcbiAgICAgIG91dFxuXG4gIHJpbmdNb2QuX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBpc1N0ZXJlbyA9IGZhbHNlXG4gICAgaWYoIG91dCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgaXNTdGVyZW8gPSB0eXBlb2YgcHJvcHMuaW5wdXQuaXNTdGVyZW8gIT09ICd1bmRlZmluZWQnID8gcHJvcHMuaW5wdXQuaXNTdGVyZW8gOiBmYWxzZSBcbiAgICB9ZWxzZXtcbiAgICAgIGlzU3RlcmVvID0gb3V0LmlucHV0LmlzU3RlcmVvXG4gICAgICBvdXQuaXNTdGVyZW8gPSBpc1N0ZXJlb1xuICAgIH0gICAgXG5cbiAgICBjb25zdCBpbnB1dCA9IGcuaW4oICdpbnB1dCcgKSxcbiAgICAgICAgICBpbnB1dEdhaW4gPSBnLmluKCAnaW5wdXRHYWluJyApLFxuICAgICAgICAgIGZyZXF1ZW5jeSA9IGcuaW4oICdmcmVxdWVuY3knICksXG4gICAgICAgICAgZ2FpbiA9IGcuaW4oICdnYWluJyApLFxuICAgICAgICAgIG1peCA9IGcuaW4oICdtaXgnIClcbiAgICBcbiAgICBjb25zdCBsZWZ0SW5wdXQgPSBpc1N0ZXJlbyA/IGcubXVsKCBpbnB1dFswXSwgaW5wdXRHYWluICkgOiBnLm11bCggaW5wdXQsIGlucHV0R2FpbiApLFxuICAgICAgICAgIHNpbmUgPSBnLm11bCggZy5jeWNsZSggZnJlcXVlbmN5ICksIGdhaW4gKVxuICAgXG4gICAgY29uc3QgbGVmdCA9IGcuYWRkKCBnLm11bCggbGVmdElucHV0LCBnLnN1YiggMSwgbWl4ICkpLCBnLm11bCggZy5tdWwoIGxlZnRJbnB1dCwgc2luZSApLCBtaXggKSApIFxuICAgICAgICBcbiAgICBpZiggaXNTdGVyZW8gPT09IHRydWUgKSB7XG4gICAgICBjb25zdCByaWdodElucHV0ID0gZy5tdWwoIGlucHV0WzFdLCBpbnB1dEdhaW4gKSxcbiAgICAgICAgICAgIHJpZ2h0ID0gZy5hZGQoIGcubXVsKCByaWdodElucHV0LCBnLnN1YiggMSwgbWl4ICkpLCBnLm11bCggZy5tdWwoIHJpZ2h0SW5wdXQsIHNpbmUgKSwgbWl4ICkgKSBcbiAgICAgIFxuICAgICAgcmluZ01vZC5ncmFwaCA9IFsgbGVmdCwgcmlnaHQgXVxuICAgIH1lbHNle1xuICAgICAgcmluZ01vZC5ncmFwaCA9IGxlZnRcbiAgICB9XG4gIH1cblxuICByaW5nTW9kLl9fY3JlYXRlR3JhcGgoKSBcbiAgcmluZ01vZC5fX3JlcXVpcmVzUmVjb21waWxhdGlvbiA9IFsgJ2lucHV0JyBdXG5cbiAgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgIHJpbmdNb2QsXG4gICAgcmluZ01vZC5ncmFwaCwgXG4gICAgWyAnZngnLCdyaW5nTW9kJ10sIFxuICAgIHByb3BzIFxuICApXG4gIFxuICByZXR1cm4gb3V0IFxufVxuXG5SaW5nTW9kLmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBmcmVxdWVuY3k6MjIwLFxuICBnYWluOiAxLCBcbiAgbWl4OjFcbn1cblxucmV0dXJuIFJpbmdNb2RcblxufVxuIiwiY29uc3QgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgICBlZmZlY3QgPSByZXF1aXJlKCAnLi9lZmZlY3QuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuIFxuY29uc3QgVHJlbW9sbyA9IGlucHV0UHJvcHMgPT4ge1xuICBjb25zdCBwcm9wcyAgID0gT2JqZWN0LmFzc2lnbigge30sIFRyZW1vbG8uZGVmYXVsdHMsIGVmZmVjdC5kZWZhdWx0cywgaW5wdXRQcm9wcyApLFxuICAgICAgICB0cmVtb2xvID0gT2JqZWN0LmNyZWF0ZSggZWZmZWN0IClcbiAgXG4gIGxldCBvdXRcbiAgdHJlbW9sby5fX2NyZWF0ZUdyYXBoID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IGlzU3RlcmVvID0gZmFsc2VcbiAgICBpZiggb3V0ID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBpc1N0ZXJlbyA9IHR5cGVvZiBwcm9wcy5pbnB1dC5pc1N0ZXJlbyAhPT0gJ3VuZGVmaW5lZCcgPyBwcm9wcy5pbnB1dC5pc1N0ZXJlbyA6IGZhbHNlIFxuICAgIH1lbHNle1xuICAgICAgaXNTdGVyZW8gPSBvdXQuaW5wdXQuaXNTdGVyZW9cbiAgICAgIG91dC5pc1N0ZXJlbyA9IGlzU3RlcmVvXG4gICAgfSAgICBcblxuICAgIGNvbnN0IGlucHV0ID0gZy5pbiggJ2lucHV0JyApLFxuICAgICAgICAgIGlucHV0R2FpbiA9IGcuaW4oICdpbnB1dEdhaW4nICksXG4gICAgICAgICAgZnJlcXVlbmN5ID0gZy5pbiggJ2ZyZXF1ZW5jeScgKSxcbiAgICAgICAgICBhbW91bnQgPSBnLmluKCAnYW1vdW50JyApXG4gICAgXG4gICAgY29uc3QgbGVmdElucHV0ID0gaXNTdGVyZW8gPyBnLm11bCggaW5wdXRbMF0sIGlucHV0R2FpbiApIDogZy5tdWwoIGlucHV0LCBpbnB1dEdhaW4gKVxuXG4gICAgbGV0IG9zY1xuICAgIGlmKCBwcm9wcy5zaGFwZSA9PT0gJ3NxdWFyZScgKSB7XG4gICAgICBvc2MgPSBnLmd0KCBnLnBoYXNvciggZnJlcXVlbmN5ICksIDAgKVxuICAgIH1lbHNlIGlmKCBwcm9wcy5zaGFwZSA9PT0gJ3NhdycgKSB7XG4gICAgICBvc2MgPSBnLmd0cCggZy5waGFzb3IoIGZyZXF1ZW5jeSApLCAwIClcbiAgICB9ZWxzZXtcbiAgICAgIG9zYyA9IGcuY3ljbGUoIGZyZXF1ZW5jeSApXG4gICAgfVxuXG4gICAgY29uc3QgbW9kID0gZy5tdWwoIG9zYywgYW1vdW50IClcbiAgIFxuICAgIGNvbnN0IGxlZnQgPSBnLnN1YiggbGVmdElucHV0LCBnLm11bCggbGVmdElucHV0LCBtb2QgKSApXG5cbiAgICBpZiggaXNTdGVyZW8gPT09IHRydWUgKSB7XG4gICAgICBjb25zdCByaWdodElucHV0ID0gZy5tdWwoIGlucHV0WzFdLCBpbnB1dEdhaW4gKSxcbiAgICAgICAgICAgIHJpZ2h0ID0gZy5tdWwoIHJpZ2h0SW5wdXQsIG1vZCApXG5cbiAgICAgIHRyZW1vbG8uZ3JhcGggPSBbIGxlZnQsIHJpZ2h0IF1cbiAgICB9ZWxzZXtcbiAgICAgIHRyZW1vbG8uZ3JhcGggPSBsZWZ0XG4gICAgfVxuICB9XG4gIFxuICB0cmVtb2xvLl9fY3JlYXRlR3JhcGgoKVxuICB0cmVtb2xvLl9fcmVxdWlyZXNSZWNvbXBpbGF0aW9uID0gWyAnaW5wdXQnIF1cblxuICBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggXG4gICAgdHJlbW9sbyxcbiAgICB0cmVtb2xvLmdyYXBoLFxuICAgIFsnZngnLCd0cmVtb2xvJ10sIFxuICAgIHByb3BzIFxuICApIFxuICByZXR1cm4gb3V0IFxufVxuXG5UcmVtb2xvLmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBmcmVxdWVuY3k6MixcbiAgYW1vdW50OiAxLCBcbiAgc2hhcGU6J3NpbmUnXG59XG5cbnJldHVybiBUcmVtb2xvXG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgZWZmZWN0ID0gcmVxdWlyZSggJy4vZWZmZWN0LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcbiBcbmNvbnN0IFZpYnJhdG8gPSBpbnB1dFByb3BzID0+IHtcbiAgY29uc3QgcHJvcHMgICA9IE9iamVjdC5hc3NpZ24oIHt9LCBWaWJyYXRvLmRlZmF1bHRzLCBlZmZlY3QuZGVmYXVsdHMsIGlucHV0UHJvcHMgKSxcbiAgICAgICAgdmlicmF0byA9IE9iamVjdC5jcmVhdGUoIGVmZmVjdCApXG5cbiAgbGV0IG91dFxuICB2aWJyYXRvLl9fY3JlYXRlR3JhcGggPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgaXNTdGVyZW8gPSBmYWxzZVxuICAgIGlmKCBvdXQgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIGlzU3RlcmVvID0gdHlwZW9mIHByb3BzLmlucHV0LmlzU3RlcmVvICE9PSAndW5kZWZpbmVkJyA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogZmFsc2UgXG4gICAgfWVsc2V7XG4gICAgICBpc1N0ZXJlbyA9IG91dC5pbnB1dC5pc1N0ZXJlb1xuICAgICAgb3V0LmlzU3RlcmVvID0gaXNTdGVyZW9cbiAgICB9ICAgIFxuXG4gICAgY29uc3QgaW5wdXQgPSBnLmluKCAnaW5wdXQnICksXG4gICAgICAgICAgaW5wdXRHYWluID0gZy5pbiggJ2lucHV0R2FpbicgKSxcbiAgICAgICAgICBkZWxheUxlbmd0aCA9IDQ0MTAwLFxuICAgICAgICAgIGZlZWRiYWNrQ29lZmYgPSBnLmluKCAnZmVlZGJhY2snICksXG4gICAgICAgICAgbW9kQW1vdW50ID0gZy5pbiggJ2Ftb3VudCcgKSxcbiAgICAgICAgICBmcmVxdWVuY3kgPSBnLmluKCAnZnJlcXVlbmN5JyApLFxuICAgICAgICAgIGRlbGF5QnVmZmVyTCA9IGcuZGF0YSggZGVsYXlMZW5ndGggKVxuXG4gICAgY29uc3Qgd3JpdGVJZHggPSBnLmFjY3VtKCAxLDAsIHsgbWluOjAsIG1heDpkZWxheUxlbmd0aCwgaW50ZXJwOidub25lJywgbW9kZTonc2FtcGxlcycgfSlcbiAgICBcbiAgICBjb25zdCBvZmZzZXQgPSBnLm11bCggbW9kQW1vdW50LCA1MDAgKVxuICAgIFxuICAgIGNvbnN0IHJlYWRJZHggPSBnLndyYXAoIFxuICAgICAgZy5hZGQoIFxuICAgICAgICBnLnN1Yiggd3JpdGVJZHgsIG9mZnNldCApLCBcbiAgICAgICAgZy5tdWwoIGcuY3ljbGUoIGZyZXF1ZW5jeSApLCBnLnN1Yiggb2Zmc2V0LCAxICkgKSBcbiAgICAgICksIFxuICAgICAgMCwgXG4gICAgICBkZWxheUxlbmd0aFxuICAgIClcblxuICAgIGNvbnN0IGxlZnRJbnB1dCA9IGlzU3RlcmVvID8gZy5tdWwoIGlucHV0WzBdLCBpbnB1dEdhaW4gKSA6IGcubXVsKCBpbnB1dCwgaW5wdXRHYWluIClcblxuICAgIGNvbnN0IGRlbGF5ZWRPdXRMID0gZy5wZWVrKCBkZWxheUJ1ZmZlckwsIHJlYWRJZHgsIHsgaW50ZXJwOidsaW5lYXInLCBtb2RlOidzYW1wbGVzJyB9KVxuICAgIFxuICAgIGcucG9rZSggZGVsYXlCdWZmZXJMLCBnLmFkZCggbGVmdElucHV0LCBnLm11bCggZGVsYXllZE91dEwsIGZlZWRiYWNrQ29lZmYgKSApLCB3cml0ZUlkeCApXG5cbiAgICBjb25zdCBsZWZ0ID0gZGVsYXllZE91dExcblxuICAgIGlmKCBpc1N0ZXJlbyA9PT0gdHJ1ZSApIHtcbiAgICAgIGNvbnN0IHJpZ2h0SW5wdXQgPSBnLm11bCggaW5wdXRbMV0sIGlucHV0R2FpbiApXG4gICAgICBjb25zdCBkZWxheUJ1ZmZlclIgPSBnLmRhdGEoIGRlbGF5TGVuZ3RoIClcbiAgICAgIFxuICAgICAgY29uc3QgZGVsYXllZE91dFIgPSBnLnBlZWsoIGRlbGF5QnVmZmVyUiwgcmVhZElkeCwgeyBpbnRlcnA6J2xpbmVhcicsIG1vZGU6J3NhbXBsZXMnIH0pXG5cbiAgICAgIGcucG9rZSggZGVsYXlCdWZmZXJSLCBnLmFkZCggcmlnaHRJbnB1dCwgbXVsKCBkZWxheWVkT3V0UiwgZmVlZGJhY2tDb2VmZiApICksIHdyaXRlSWR4IClcbiAgICAgIGNvbnN0IHJpZ2h0ID0gZGVsYXllZE91dFJcblxuICAgICAgdmlicmF0by5ncmFwaCA9IFsgbGVmdCwgcmlnaHQgXVxuICAgIH1lbHNle1xuICAgICAgdmlicmF0by5ncmFwaCA9IGxlZnQgXG4gICAgfVxuICB9XG5cbiAgdmlicmF0by5fX2NyZWF0ZUdyYXBoKClcbiAgdmlicmF0by5fX3JlcXVpcmVzUmVjb21waWxhdGlvbiA9IFsgJ2lucHV0JyBdXG5cbiAgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIFxuICAgIHZpYnJhdG8sXG4gICAgdmlicmF0by5ncmFwaCwgICAgXG4gICAgWyAnZngnLCAndmlicmF0bycgXSwgXG4gICAgcHJvcHMgXG4gICkgXG4gIHJldHVybiBvdXQgXG59XG5cblZpYnJhdG8uZGVmYXVsdHMgPSB7XG4gIGlucHV0OjAsXG4gIGZlZWRiYWNrOi4wMSxcbiAgYW1vdW50Oi41LFxuICBmcmVxdWVuY3k6NFxufVxuXG5yZXR1cm4gVmlicmF0b1xuXG59XG4iLCJsZXQgTWVtb3J5SGVscGVyID0gcmVxdWlyZSggJ21lbW9yeS1oZWxwZXInICksXG4gICAgZ2VuaXNoICAgICAgID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKVxuICAgIFxubGV0IEdpYmJlcmlzaCA9IHtcbiAgYmxvY2tDYWxsYmFja3M6IFtdLCAvLyBjYWxsZWQgZXZlcnkgYmxvY2tcbiAgZGlydHlVZ2VuczogW10sXG4gIGNhbGxiYWNrVWdlbnM6IFtdLFxuICBjYWxsYmFja05hbWVzOiBbXSxcbiAgYW5hbHl6ZXJzOiBbXSxcbiAgZ3JhcGhJc0RpcnR5OiBmYWxzZSxcbiAgdWdlbnM6IHt9LFxuICBkZWJ1ZzogZmFsc2UsXG4gIGlkOiAtMSxcbiAgcHJldmVudFByb3h5OmZhbHNlLFxuICBwcm94eUVuYWJsZWQ6IHRydWUsXG5cbiAgb3V0cHV0OiBudWxsLFxuXG4gIG1lbW9yeSA6IG51bGwsIC8vIDIwIG1pbnV0ZXMgYnkgZGVmYXVsdD9cbiAgZmFjdG9yeTogbnVsbCwgXG4gIGdlbmlzaCxcbiAgc2NoZWR1bGVyOiByZXF1aXJlKCAnLi9zY2hlZHVsaW5nL3NjaGVkdWxlci5qcycgKSxcbiAgLy93b3JrbGV0UHJvY2Vzc29yTG9hZGVyOiByZXF1aXJlKCAnLi93b3JrbGV0UHJvY2Vzc29yLmpzJyApLFxuICB3b3JrbGV0UHJvY2Vzc29yOiBudWxsLFxuXG4gIG1lbW9lZDoge30sXG4gIG1vZGU6J3NjcmlwdFByb2Nlc3NvcicsXG5cbiAgcHJvdG90eXBlczoge1xuICAgIHVnZW46IG51bGwsLy9yZXF1aXJlKCcuL3VnZW4uanMnKSxcbiAgICBpbnN0cnVtZW50OiByZXF1aXJlKCAnLi9pbnN0cnVtZW50cy9pbnN0cnVtZW50LmpzJyApLFxuICAgIGVmZmVjdDogcmVxdWlyZSggJy4vZngvZWZmZWN0LmpzJyApLFxuICB9LFxuXG4gIG1peGluczoge1xuICAgIHBvbHlpbnN0cnVtZW50OiByZXF1aXJlKCAnLi9pbnN0cnVtZW50cy9wb2x5TWl4aW4uanMnIClcbiAgfSxcblxuICB3b3JrbGV0UGF0aDogJy4vZ2liYmVyaXNoX3dvcmtsZXQuanMnLFxuICBpbml0KCBtZW1BbW91bnQsIGN0eCwgbW9kZSApIHtcblxuICAgIGxldCBudW1CeXRlcyA9IGlzTmFOKCBtZW1BbW91bnQgKSA/IDIwICogNjAgKiA0NDEwMCA6IG1lbUFtb3VudFxuXG4gICAgLy8gcmVnYXJkbGVzcyBvZiB3aGV0aGVyIG9yIG5vdCBnaWJiZXJpc2ggaXMgdXNpbmcgd29ya2xldHMsXG4gICAgLy8gd2Ugc3RpbGwgd2FudCBnZW5pc2ggdG8gb3V0cHV0IHZhbmlsbGEganMgZnVuY3Rpb25zIGluc3RlYWRcbiAgICAvLyBvZiBhdWRpbyB3b3JrbGV0IGNsYXNzZXM7IHRoZXNlIGZ1bmN0aW9ucyB3aWxsIGJlIGNhbGxlZFxuICAgIC8vIGZyb20gd2l0aGluIHRoZSBnaWJiZXJpc2ggYXVkaW93b3JrbGV0IHByb2Nlc3NvciBub2RlLlxuICAgIHRoaXMuZ2VuaXNoLmdlbi5tb2RlID0gJ3NjcmlwdFByb2Nlc3NvcidcblxuICAgIHRoaXMubWVtb3J5ID0gTWVtb3J5SGVscGVyLmNyZWF0ZSggbnVtQnl0ZXMsIEZsb2F0NjRBcnJheSApXG5cbiAgICB0aGlzLm1vZGUgPSB3aW5kb3cuQXVkaW9Xb3JrbGV0ICE9PSB1bmRlZmluZWQgPyAnd29ya2xldCcgOiAnc2NyaXB0cHJvY2Vzc29yJ1xuICAgIGlmKCBtb2RlICE9PSB1bmRlZmluZWQgKSB0aGlzLm1vZGUgPSBtb2RlXG5cbiAgICB0aGlzLmhhc1dvcmtsZXQgPSB3aW5kb3cuQXVkaW9Xb3JrbGV0ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHdpbmRvdy5BdWRpb1dvcmtsZXQgPT09ICdmdW5jdGlvbidcblxuICAgIGNvbnN0IHN0YXJ0dXAgPSB0aGlzLmhhc1dvcmtsZXQgPyB0aGlzLnV0aWxpdGllcy5jcmVhdGVXb3JrbGV0IDogdGhpcy51dGlsaXRpZXMuY3JlYXRlU2NyaXB0UHJvY2Vzc29yXG4gICAgXG4gICAgdGhpcy5hbmFseXplcnMuZGlydHkgPSBmYWxzZVxuXG4gICAgaWYoIHRoaXMubW9kZSA9PT0gJ3dvcmtsZXQnICkge1xuXG4gICAgICBjb25zdCBwID0gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QgKSA9PiB7XG5cbiAgICAgICAgY29uc3QgcHAgPSBuZXcgUHJvbWlzZSggKF9fcmVzb2x2ZSwgX19yZWplY3QgKSA9PiB7XG4gICAgICAgICAgdGhpcy51dGlsaXRpZXMuY3JlYXRlQ29udGV4dCggY3R4LCBzdGFydHVwLmJpbmQoIHRoaXMudXRpbGl0aWVzICksIF9fcmVzb2x2ZSApXG4gICAgICAgIH0pLnRoZW4oICgpPT4ge1xuICAgICAgICAgIEdpYmJlcmlzaC5wcmV2ZW50UHJveHkgPSB0cnVlXG4gICAgICAgICAgR2liYmVyaXNoLmxvYWQoKVxuICAgICAgICAgIEdpYmJlcmlzaC5vdXRwdXQgPSB0aGlzLkJ1czIoKVxuICAgICAgICAgIEdpYmJlcmlzaC5wcmV2ZW50UHJveHkgPSBmYWxzZVxuXG4gICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG4gICAgICByZXR1cm4gcFxuICAgIH1lbHNlIGlmKCB0aGlzLm1vZGUgPT09ICdwcm9jZXNzb3InICkge1xuICAgICAgR2liYmVyaXNoLmxvYWQoKVxuICAgICAgR2liYmVyaXNoLm91dHB1dCA9IHRoaXMuQnVzMigpXG4gICAgICBHaWJiZXJpc2guY2FsbGJhY2sgPSBHaWJiZXJpc2guZ2VuZXJhdGVDYWxsYmFjaygpXG4gICAgfVxuXG5cbiAgfSxcblxuICBsb2FkKCkge1xuICAgIHRoaXMuZmFjdG9yeSA9IHJlcXVpcmUoICcuL3VnZW5UZW1wbGF0ZS5qcycgKSggdGhpcyApXG4gICAgXG4gICAgdGhpcy5QYW5uZXIgICAgICAgPSByZXF1aXJlKCAnLi9taXNjL3Bhbm5lci5qcycgKSggdGhpcyApXG4gICAgdGhpcy5Qb2x5VGVtcGxhdGUgPSByZXF1aXJlKCAnLi9pbnN0cnVtZW50cy9wb2x5dGVtcGxhdGUuanMnICkoIHRoaXMgKVxuICAgIHRoaXMub3NjaWxsYXRvcnMgID0gcmVxdWlyZSggJy4vb3NjaWxsYXRvcnMvb3NjaWxsYXRvcnMuanMnICkoIHRoaXMgKVxuICAgIHRoaXMuZmlsdGVycyAgICAgID0gcmVxdWlyZSggJy4vZmlsdGVycy9maWx0ZXJzLmpzJyApKCB0aGlzIClcbiAgICB0aGlzLmJpbm9wcyAgICAgICA9IHJlcXVpcmUoICcuL21pc2MvYmlub3BzLmpzJyApKCB0aGlzIClcbiAgICB0aGlzLm1vbm9wcyAgICAgICA9IHJlcXVpcmUoICcuL21pc2MvbW9ub3BzLmpzJyApKCB0aGlzIClcbiAgICB0aGlzLkJ1cyAgICAgICAgICA9IHJlcXVpcmUoICcuL21pc2MvYnVzLmpzJyApKCB0aGlzIClcbiAgICB0aGlzLkJ1czIgICAgICAgICA9IHJlcXVpcmUoICcuL21pc2MvYnVzMi5qcycgKSggdGhpcyApO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgID0gcmVxdWlyZSggJy4vaW5zdHJ1bWVudHMvaW5zdHJ1bWVudHMuanMnICkoIHRoaXMgKVxuICAgIHRoaXMuZnggICAgICAgICAgID0gcmVxdWlyZSggJy4vZngvZWZmZWN0cy5qcycgKSggdGhpcyApXG4gICAgdGhpcy5TZXF1ZW5jZXIgICAgPSByZXF1aXJlKCAnLi9zY2hlZHVsaW5nL3NlcXVlbmNlci5qcycgKSggdGhpcyApO1xuICAgIHRoaXMuU2VxdWVuY2VyMiAgID0gcmVxdWlyZSggJy4vc2NoZWR1bGluZy9zZXEyLmpzJyApKCB0aGlzICk7XG4gICAgdGhpcy5lbnZlbG9wZXMgICAgPSByZXF1aXJlKCAnLi9lbnZlbG9wZXMvZW52ZWxvcGVzLmpzJyApKCB0aGlzICk7XG4gICAgdGhpcy5hbmFseXNpcyAgICAgPSByZXF1aXJlKCAnLi9hbmFseXNpcy9hbmFseXplcnMuanMnICkoIHRoaXMgKVxuICAgIHRoaXMudGltZSAgICAgICAgID0gcmVxdWlyZSggJy4vbWlzYy90aW1lLmpzJyApKCB0aGlzIClcbiAgICB0aGlzLlByb3h5ICAgICAgICA9IHJlcXVpcmUoICcuL3dvcmtsZXRQcm94eS5qcycgKSggdGhpcyApXG4gIH0sXG5cbiAgZXhwb3J0KCB0YXJnZXQsIHNob3VsZEV4cG9ydEdlbmlzaD1mYWxzZSApIHtcbiAgICBpZiggdGFyZ2V0ID09PSB1bmRlZmluZWQgKSB0aHJvdyBFcnJvcignWW91IG11c3QgZGVmaW5lIGEgdGFyZ2V0IG9iamVjdCBmb3IgR2liYmVyaXNoIHRvIGV4cG9ydCB2YXJpYWJsZXMgdG8uJylcblxuICAgIGlmKCBzaG91bGRFeHBvcnRHZW5pc2ggKSB0aGlzLmdlbmlzaC5leHBvcnQoIHRhcmdldCApXG5cbiAgICB0aGlzLmluc3RydW1lbnRzLmV4cG9ydCggdGFyZ2V0IClcbiAgICB0aGlzLmZ4LmV4cG9ydCggdGFyZ2V0IClcbiAgICB0aGlzLmZpbHRlcnMuZXhwb3J0KCB0YXJnZXQgKVxuICAgIHRoaXMub3NjaWxsYXRvcnMuZXhwb3J0KCB0YXJnZXQgKVxuICAgIHRoaXMuYmlub3BzLmV4cG9ydCggdGFyZ2V0IClcbiAgICB0aGlzLm1vbm9wcy5leHBvcnQoIHRhcmdldCApXG4gICAgdGhpcy5lbnZlbG9wZXMuZXhwb3J0KCB0YXJnZXQgKVxuICAgIHRoaXMuYW5hbHlzaXMuZXhwb3J0KCB0YXJnZXQgKVxuICAgIHRhcmdldC5TZXF1ZW5jZXIgPSB0aGlzLlNlcXVlbmNlclxuICAgIHRhcmdldC5TZXF1ZW5jZXIyID0gdGhpcy5TZXF1ZW5jZXIyXG4gICAgdGFyZ2V0LkJ1cyA9IHRoaXMuQnVzXG4gICAgdGFyZ2V0LkJ1czIgPSB0aGlzLkJ1czJcbiAgICB0YXJnZXQuU2NoZWR1bGVyID0gdGhpcy5zY2hlZHVsZXJcbiAgICB0aGlzLnRpbWUuZXhwb3J0KCB0YXJnZXQgKVxuICAgIHRoaXMudXRpbGl0aWVzLmV4cG9ydCggdGFyZ2V0IClcbiAgfSxcblxuICBwcmludCgpIHtcbiAgICBjb25zb2xlLmxvZyggdGhpcy5jYWxsYmFjay50b1N0cmluZygpIClcbiAgfSxcblxuICBkaXJ0eSggdWdlbiApIHtcbiAgICBpZiggdWdlbiA9PT0gdGhpcy5hbmFseXplcnMgKSB7XG4gICAgICB0aGlzLmdyYXBoSXNEaXJ0eSA9IHRydWVcbiAgICAgIHRoaXMuYW5hbHl6ZXJzLmRpcnR5ID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRpcnR5VWdlbnMucHVzaCggdWdlbiApXG4gICAgICB0aGlzLmdyYXBoSXNEaXJ0eSA9IHRydWVcbiAgICAgIGlmKCB0aGlzLm1lbW9lZFsgdWdlbi51Z2VuTmFtZSBdICkge1xuICAgICAgICBkZWxldGUgdGhpcy5tZW1vZWRbIHVnZW4udWdlbk5hbWUgXVxuICAgICAgfVxuICAgIH0gXG4gIH0sXG5cbiAgY2xlYXIoKSB7XG4gICAgLy8gZG8gbm90IGRlbGV0ZSB0aGUgZ2FpbiBhbmQgdGhlIHBhbiBvZiB0aGUgbWFzdGVyIGJ1cyBcbiAgICB0aGlzLm91dHB1dC5pbnB1dHMuc3BsaWNlKCAwLCB0aGlzLm91dHB1dC5pbnB1dHMubGVuZ3RoIC0gMiApXG4gICAgLy90aGlzLm91dHB1dC5pbnB1dE5hbWVzLmxlbmd0aCA9IDBcbiAgICB0aGlzLmFuYWx5emVycy5sZW5ndGggPSAwXG4gICAgdGhpcy5zY2hlZHVsZXIuY2xlYXIoKVxuICAgIHRoaXMuZGlydHkoIHRoaXMub3V0cHV0IClcbiAgICBpZiggdGhpcy5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgICB0aGlzLndvcmtsZXQucG9ydC5wb3N0TWVzc2FnZSh7IFxuICAgICAgICBhZGRyZXNzOidtZXRob2QnLCBcbiAgICAgICAgb2JqZWN0OnRoaXMuaWQsXG4gICAgICAgIG5hbWU6J2NsZWFyJyxcbiAgICAgICAgYXJnczpbXVxuICAgICAgfSlcbiAgICB9XG4gICAgICAvLyBjbGVhciBtZW1vcnkuLi4gWFhYIHNob3VsZCB0aGlzIGJlIGEgTWVtb3J5SGVscGVyIGZ1bmN0aW9uP1xuICAgIC8vdGhpcy5tZW1vcnkuaGVhcC5maWxsKDApXG4gICAgLy90aGlzLm1lbW9yeS5saXN0ID0ge31cbiAgICAvL0dpYmJlcmlzaC5vdXRwdXQgPSB0aGlzLkJ1czIoKVxuICAgIFxuICB9LFxuXG4gIC8vIHVzZWQgdG8gc29ydCBhbmFseXNpcyB1Z2VucyBieSBwcmlvcml0eS5cbiAgLy8gaGlnaGVyIHByaW9yaXRpZXMgbWVhbiBsb3dlciBvcmRlcmluZyBpbiB0aGUgYXJyYXksXG4gIC8vIHdoaWNoIG1lYW5zIHRoZXkgd2lsbCBydW4gZmlyc3QgaW4gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAvLyBieSBkZWZ1bHQsIGFuYWx5c2lzIHVnZW5zIGFyZSBhc3NpZ25lZCBhIHByaW9yaXR5IG9mIDAgaW4gdGhlXG4gIC8vIGFuYWx5c2lzIHByb3RvdHlwZS5cbiAgYW5hbHlzaXNDb21wYXJlKCBhLGIgKSB7XG4gICAgcmV0dXJuIGIucHJpb3JpdHkgLSBhLnByaW9yaXR5XG4gIH0sXG5cbiAgZ2VuZXJhdGVDYWxsYmFjaygpIHtcbiAgICBpZiggdGhpcy5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgICBHaWJiZXJpc2guY2FsbGJhY2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDAgfVxuICAgICAgcmV0dXJuIEdpYmJlcmlzaC5jYWxsYmFja1xuICAgIH1cbiAgICBsZXQgdWlkID0gMCxcbiAgICAgICAgY2FsbGJhY2tCb2R5LCBsYXN0TGluZSwgYW5hbHlzaXM9JydcblxuICAgIHRoaXMubWVtb2VkID0ge31cblxuICAgIGNhbGxiYWNrQm9keSA9IHRoaXMucHJvY2Vzc0dyYXBoKCB0aGlzLm91dHB1dCApXG4gICAgbGFzdExpbmUgPSBjYWxsYmFja0JvZHlbIGNhbGxiYWNrQm9keS5sZW5ndGggLSAxXVxuICAgIGNhbGxiYWNrQm9keS51bnNoaWZ0KCBcIlxcdCd1c2Ugc3RyaWN0J1wiIClcblxuICAgIHRoaXMuYW5hbHl6ZXJzLnNvcnQoIHRoaXMuYW5hbHlzaXNDb21wYXJlIClcbiAgICB0aGlzLmFuYWx5emVycy5mb3JFYWNoKCB2PT4ge1xuICAgICAgY29uc3QgYW5hbHlzaXNCbG9jayA9IEdpYmJlcmlzaC5wcm9jZXNzVWdlbiggdiApXG4gICAgICAvL2lmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3Byb2Nlc3NvcicgKSB7XG4gICAgICAvLyAgY29uc29sZS5sb2coICdhbmFseXNpczonLCBhbmFseXNpc0Jsb2NrLCB2ICApXG4gICAgICAvL31cbiAgICAgIGxldCBhbmFseXNpc0xpbmVcblxuICAgICAgaWYoIHR5cGVvZiBhbmFseXNpc0Jsb2NrID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgYW5hbHlzaXNMaW5lID0gYW5hbHlzaXNCbG9jay5wb3AoKVxuXG4gICAgICAgIGFuYWx5c2lzQmxvY2suZm9yRWFjaCggdiA9PiB7XG4gICAgICAgICAgY2FsbGJhY2tCb2R5LnNwbGljZSggY2FsbGJhY2tCb2R5Lmxlbmd0aCAtIDEsIDAsIHYgKVxuICAgICAgICB9KVxuICAgICAgfWVsc2V7XG4gICAgICAgIGFuYWx5c2lzTGluZSA9IGFuYWx5c2lzQmxvY2tcbiAgICAgIH1cblxuICAgICAgY2FsbGJhY2tCb2R5LnB1c2goIGFuYWx5c2lzTGluZSApXG4gICAgfSlcblxuICAgIHRoaXMuYW5hbHl6ZXJzLmZvckVhY2goIHYgPT4ge1xuICAgICAgaWYoIHRoaXMuY2FsbGJhY2tVZ2Vucy5pbmRleE9mKCB2LmNhbGxiYWNrICkgPT09IC0xIClcbiAgICAgICAgdGhpcy5jYWxsYmFja1VnZW5zLnB1c2goIHYuY2FsbGJhY2sgKVxuICAgIH0pXG4gICAgdGhpcy5jYWxsYmFja05hbWVzID0gdGhpcy5jYWxsYmFja1VnZW5zLm1hcCggdiA9PiB2LnVnZW5OYW1lIClcblxuICAgIGNhbGxiYWNrQm9keS5wdXNoKCAnXFxuXFx0cmV0dXJuICcgKyBsYXN0TGluZS5zcGxpdCggJz0nIClbMF0uc3BsaXQoICcgJyApWzFdIClcblxuICAgIGlmKCB0aGlzLmRlYnVnID09PSB0cnVlICkgY29uc29sZS5sb2coICdjYWxsYmFjazpcXG4nLCBjYWxsYmFja0JvZHkuam9pbignXFxuJykgKVxuICAgIHRoaXMuY2FsbGJhY2tOYW1lcy5wdXNoKCAnbWVtJyApXG4gICAgdGhpcy5jYWxsYmFja1VnZW5zLnB1c2goIHRoaXMubWVtb3J5LmhlYXAgKVxuICAgIHRoaXMuY2FsbGJhY2sgPSBGdW5jdGlvbiggLi4udGhpcy5jYWxsYmFja05hbWVzLCBjYWxsYmFja0JvZHkuam9pbiggJ1xcbicgKSApLy8uYmluZCggbnVsbCwgLi4udGhpcy5jYWxsYmFja1VnZW5zIClcbiAgICB0aGlzLmNhbGxiYWNrLm91dCA9IFtdXG5cbiAgICBpZiggdGhpcy5vbmNhbGxiYWNrICkgdGhpcy5vbmNhbGxiYWNrKCB0aGlzLmNhbGxiYWNrIClcblxuICAgIHJldHVybiB0aGlzLmNhbGxiYWNrIFxuICB9LFxuXG4gIHByb2Nlc3NHcmFwaCggb3V0cHV0ICkge1xuICAgIHRoaXMuY2FsbGJhY2tVZ2Vucy5sZW5ndGggPSAwXG4gICAgdGhpcy5jYWxsYmFja05hbWVzLmxlbmd0aCA9IDBcblxuICAgIHRoaXMuY2FsbGJhY2tVZ2Vucy5wdXNoKCBvdXRwdXQuY2FsbGJhY2sgKVxuXG4gICAgbGV0IGJvZHkgPSB0aGlzLnByb2Nlc3NVZ2VuKCBvdXRwdXQgKVxuICAgIFxuXG4gICAgdGhpcy5kaXJ0eVVnZW5zLmxlbmd0aCA9IDBcbiAgICB0aGlzLmdyYXBoSXNEaXJ0eSA9IGZhbHNlXG5cbiAgICByZXR1cm4gYm9keVxuICB9LFxuICBwcm94eVJlcGxhY2UoIG9iaiApIHtcbiAgICBpZiggdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqICE9PSBudWxsICkge1xuICAgICAgaWYoIG9iai5pZCAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICBjb25zdCBfX29iaiA9IHByb2Nlc3Nvci51Z2Vucy5nZXQoIG9iai5pZCApXG4gICAgICAgIC8vY29uc29sZS5sb2coICdyZXRyaWV2ZWQ6JywgX19vYmoubmFtZSApXG5cbiAgICAgICAgLy9pZiggb2JqLnByb3AgIT09IHVuZGVmaW5lZCApIGNvbnNvbGUubG9nKCAnZ290IGEgc3NkLm91dCcsIG9iaiApXG4gICAgICAgIHJldHVybiBvYmoucHJvcCAhPT0gdW5kZWZpbmVkID8gX19vYmpbIG9iai5wcm9wIF0gOiBfX29ialxuICAgICAgfWVsc2UgaWYoIG9iai5pc0Z1bmMgPT09IHRydWUgKSB7XG4gICAgICAgIGxldCBmdW5jID0gIGV2YWwoICcoJyArIG9iai52YWx1ZSArICcpJyApXG5cbiAgICAgICAgLy9jb25zb2xlLmxvZyggJ3JlcGxhY2luZyBmdW5jdGlvbjonLCBmdW5jIClcblxuICAgICAgICByZXR1cm4gZnVuY1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmpcbiAgfSxcbiAgcHJvY2Vzc1VnZW4oIHVnZW4sIGJsb2NrICkge1xuICAgIGlmKCBibG9jayA9PT0gdW5kZWZpbmVkICkgYmxvY2sgPSBbXVxuXG4gICAgbGV0IGRpcnR5SWR4ID0gR2liYmVyaXNoLmRpcnR5VWdlbnMuaW5kZXhPZiggdWdlbiApXG5cbiAgICAvL2NvbnNvbGUubG9nKCAndWdlbk5hbWU6JywgdWdlbi51Z2VuTmFtZSApXG4gICAgbGV0IG1lbW8gPSBHaWJiZXJpc2gubWVtb2VkWyB1Z2VuLnVnZW5OYW1lIF1cblxuICAgIGlmKCBtZW1vICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICByZXR1cm4gbWVtb1xuICAgIH0gZWxzZSBpZiAodWdlbiA9PT0gdHJ1ZSB8fCB1Z2VuID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgXCJXaHkgaXMgdWdlbiBhIGJvb2xlYW4/IFt0cnVlXSBvciBbZmFsc2VdXCI7XG4gICAgfSBlbHNlIGlmKCB1Z2VuLmJsb2NrID09PSB1bmRlZmluZWQgfHwgZGlydHlJbmRleCAhPT0gLTEgKSB7XG5cbiAgXG4gICAgICBsZXQgbGluZSA9IGBcXHRjb25zdCB2XyR7dWdlbi5pZH0gPSBgIFxuICAgICAgXG4gICAgICBpZiggIXVnZW4uaXNvcCApIGxpbmUgKz0gYCR7dWdlbi51Z2VuTmFtZX0oIGBcblxuICAgICAgLy8gbXVzdCBnZXQgYXJyYXkgc28gd2UgY2FuIGtlZXAgdHJhY2sgb2YgbGVuZ3RoIGZvciBjb21tYSBpbnNlcnRpb25cbiAgICAgIGxldCBrZXlzLGVyclxuXG4gICAgICAvL3RyeSB7XG4gICAgICBrZXlzID0gdWdlbi5pc29wID09PSB0cnVlIHx8IHVnZW4udHlwZSA9PT0gJ2J1cycgfHwgdWdlbi50eXBlID09PSAnYW5hbHlzaXMnID8gT2JqZWN0LmtleXMoIHVnZW4uaW5wdXRzICkgOiBbLi4udWdlbi5pbnB1dE5hbWVzIF0gXG5cbiAgICAgIC8vfWNhdGNoKCBlICl7XG5cbiAgICAgIC8vICBjb25zb2xlLmxvZyggZSApXG4gICAgICAvLyAgZXJyID0gdHJ1ZVxuICAgICAgLy99XG4gICAgICBcbiAgICAgIC8vaWYoIGVyciA9PT0gdHJ1ZSApIHJldHVyblxuXG4gICAgICBmb3IoIGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIGxldCBrZXkgPSBrZXlzWyBpIF1cbiAgICAgICAgLy8gYmlub3AuaW5wdXRzIGlzIGFjdHVhbCB2YWx1ZXMsIG5vdCBqdXN0IHByb3BlcnR5IG5hbWVzXG4gICAgICAgIGxldCBpbnB1dCBcbiAgICAgICAgaWYoIHVnZW4uaXNvcCB8fCB1Z2VuLnR5cGUgPT09J2J1cycgfHwgdWdlbi50eXBlID09PSAnYW5hbHlzaXMnICkge1xuICAgICAgICAgIGlucHV0ID0gdWdlbi5pbnB1dHNbIGtleSBdXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIC8vaWYoIGtleSA9PT0gJ21lbW9yeScgKSBjb250aW51ZTtcbiAgXG4gICAgICAgICAgLy9jb25zb2xlLmxvZyggJ3VnZW46JywgdWdlbiwgJ2tleTonLCBrZXkgKVxuICAgICAgICAgIGlucHV0ID0gdWdlblsga2V5IF0gXG4gICAgICAgIH1cblxuICAgICAgICAvL2lmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3Byb2Nlc3NvcicgKSBjb25zb2xlLmxvZyggJ3Byb2Nlc3NvciBpbnB1dDonLCBrZXksIGlucHV0IClcbiAgICAgICAgaWYoIGlucHV0ICE9PSB1bmRlZmluZWQgKSB7IFxuICAgICAgICAgIGlmKCBpbnB1dC5ieXBhc3MgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAvLyBsb29wIHRocm91Z2ggaW5wdXRzIG9mIGNoYWluIHVudGlsIG9uZSBpcyBmb3VuZFxuICAgICAgICAgICAgLy8gdGhhdCBpcyBub3QgYmVpbmcgYnlwYXNzZWRcblxuICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2VcblxuICAgICAgICAgICAgd2hpbGUoIGlucHV0LmlucHV0ICE9PSAndW5kZWZpbmVkJyAmJiBmb3VuZCA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICAgIGlmKCB0eXBlb2YgaW5wdXQuaW5wdXQuYnlwYXNzICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IGlucHV0LmlucHV0XG4gICAgICAgICAgICAgICAgaWYoIGlucHV0LmJ5cGFzcyA9PT0gZmFsc2UgKSBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5pbnB1dFxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoIHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICBpZiggaXNOYU4oa2V5KSApIHtcbiAgICAgICAgICAgICAgbGluZSArPSBgbWVtWyR7dWdlbi5fX2FkZHJlc3Nlc19fWyBrZXkgXX1dYC8vaW5wdXRcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBsaW5lICs9IGlucHV0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmKCB0eXBlb2YgaW5wdXQgPT09ICdib29sZWFuJyApIHtcbiAgICAgICAgICAgIGxpbmUgKz0gJycgKyBpbnB1dFxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyggJ2tleTonLCBrZXksICdpbnB1dDonLCB1Z2VuLmlucHV0cywgdWdlbi5pbnB1dHNbIGtleSBdICkgXG4gICAgICAgICAgICAvLyBYWFggbm90IHN1cmUgd2h5IHRoaXMgaGFzIHRvIGJlIGhlcmUsIGJ1dCBzb21laG93IG5vbi1wcm9jZXNzZWQgb2JqZWN0c1xuICAgICAgICAgICAgLy8gdGhhdCBvbmx5IGNvbnRhaW4gaWQgbnVtYmVycyBhcmUgYmVpbmcgcGFzc2VkIGhlcmUuLi5cblxuICAgICAgICAgICAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAncHJvY2Vzc29yJyApIHtcbiAgICAgICAgICAgICAgaWYoIGlucHV0LnVnZW5OYW1lID09PSB1bmRlZmluZWQgJiYgaW5wdXQuaWQgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IEdpYmJlcmlzaC5wcm9jZXNzb3IudWdlbnMuZ2V0KCBpbnB1dC5pZCApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgR2liYmVyaXNoLnByb2Nlc3NVZ2VuKCBpbnB1dCwgYmxvY2sgKVxuXG4gICAgICAgICAgICAvL2lmKCBpbnB1dC5jYWxsYmFjayA9PT0gdW5kZWZpbmVkICkgY29udGludWVcblxuICAgICAgICAgICAgaWYoICFpbnB1dC5pc29wICkge1xuICAgICAgICAgICAgICAvLyBjaGVjayBpcyBuZWVkZWQgc28gdGhhdCBncmFwaHMgd2l0aCBzc2RzIHRoYXQgcmVmZXIgdG8gdGhlbXNlbHZlc1xuICAgICAgICAgICAgICAvLyBkb24ndCBhZGQgdGhlIHNzZCBpbiBtb3JlIHRoYW4gb25jZVxuICAgICAgICAgICAgICBpZiggR2liYmVyaXNoLmNhbGxiYWNrVWdlbnMuaW5kZXhPZiggaW5wdXQuY2FsbGJhY2sgKSA9PT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgR2liYmVyaXNoLmNhbGxiYWNrVWdlbnMucHVzaCggaW5wdXQuY2FsbGJhY2sgKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpbmUgKz0gYHZfJHtpbnB1dC5pZH1gXG4gICAgICAgICAgICBpbnB1dC5fX3Zhcm5hbWUgPSBgdl8ke2lucHV0LmlkfWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiggaSA8IGtleXMubGVuZ3RoIC0gMSApIHtcbiAgICAgICAgICAgIGlmKCB1Z2VuLmlzb3AgPT09IHRydWUgKSB7XG4gICAgICAgICAgICAgIGlmKCB1Z2VuLm9wID09PSAnKicgfHwgdWdlbi5vcCA9PT0gJy8nICkge1xuICAgICAgICAgICAgICAgIGlmKCBpbnB1dCAhPSAxICkge1xuICAgICAgICAgICAgICAgICAgbGluZSArPSAnICcgKyB1Z2VuLm9wICsgJyAnXG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICBsaW5lID0gbGluZS5zbGljZSggMCwgLTEgKiAoJycraW5wdXQpLmxlbmd0aCApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBsaW5lICs9ICcgJyArIHVnZW4ub3AgKyAnICdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGxpbmUgKz0gJywgJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvL2lmKCB1Z2VuLnR5cGUgPT09ICdidXMnICkgbGluZSArPSAnLCAnIFxuICAgICAgaWYoIHVnZW4udHlwZSA9PT0gJ2FuYWx5c2lzJyB8fCAodWdlbi50eXBlID09PSAnYnVzJyAmJiBrZXlzLmxlbmd0aCA+IDApICkgbGluZSArPSAnLCAnXG4gICAgICBpZiggIXVnZW4uaXNvcCAmJiB1Z2VuLnR5cGUgIT09ICdzZXEnICkgbGluZSArPSAnbWVtJ1xuICAgICAgbGluZSArPSB1Z2VuLmlzb3AgPyAnJyA6ICcgKSdcblxuICAgICAgYmxvY2sucHVzaCggbGluZSApXG4gICAgICBcbiAgICAgIC8vY29uc29sZS5sb2coICdtZW1vOicsIHVnZW4udWdlbk5hbWUgKVxuICAgICAgR2liYmVyaXNoLm1lbW9lZFsgdWdlbi51Z2VuTmFtZSBdID0gYHZfJHt1Z2VuLmlkfWBcblxuICAgICAgaWYoIGRpcnR5SWR4ICE9PSAtMSApIHtcbiAgICAgICAgR2liYmVyaXNoLmRpcnR5VWdlbnMuc3BsaWNlKCBkaXJ0eUlkeCwgMSApXG4gICAgICB9XG5cbiAgICB9ZWxzZSBpZiggdWdlbi5ibG9jayApIHtcbiAgICAgIHJldHVybiB1Z2VuLmJsb2NrXG4gICAgfVxuXG4gICAgcmV0dXJuIGJsb2NrXG4gIH0sXG4gICAgXG59XG5cbkdpYmJlcmlzaC5wcm90b3R5cGVzLlVnZW4gPSByZXF1aXJlKCAnLi91Z2VuLmpzJyApKCBHaWJiZXJpc2ggKVxuR2liYmVyaXNoLnV0aWxpdGllcyA9IHJlcXVpcmUoICcuL3V0aWxpdGllcy5qcycgKSggR2liYmVyaXNoIClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEdpYmJlcmlzaFxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgIGluc3RydW1lbnQgPSByZXF1aXJlKCAnLi9pbnN0cnVtZW50LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuICBjb25zdCBDb25nYSA9IGFyZ3VtZW50UHJvcHMgPT4ge1xuICAgIGxldCBjb25nYSA9IE9iamVjdC5jcmVhdGUoIGluc3RydW1lbnQgKSxcbiAgICAgICAgZnJlcXVlbmN5ID0gZy5pbiggJ2ZyZXF1ZW5jeScgKSxcbiAgICAgICAgZGVjYXkgPSBnLmluKCAnZGVjYXknICksXG4gICAgICAgIGdhaW4gID0gZy5pbiggJ2dhaW4nICksXG4gICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApXG5cbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgQ29uZ2EuZGVmYXVsdHMsIGFyZ3VtZW50UHJvcHMgKVxuXG4gICAgbGV0IHRyaWdnZXIgPSBnLmJhbmcoKSxcbiAgICAgICAgaW1wdWxzZSA9IGcubXVsKCB0cmlnZ2VyLCA2MCApLFxuICAgICAgICBfZGVjYXkgPSAgZy5zdWIoIC4xMDEsIGcuZGl2KCBkZWNheSwgMTAgKSApLCAvLyBjcmVhdGUgcmFuZ2Ugb2YgLjAwMSAtIC4wOTlcbiAgICAgICAgYnBmID0gZy5zdmYoIGltcHVsc2UsIGZyZXF1ZW5jeSwgX2RlY2F5LCAyLCBmYWxzZSApLFxuICAgICAgICBvdXQgPSBnLm11bCggYnBmLCBnLm11bCggbG91ZG5lc3MsIGdhaW4gKSApXG4gICAgXG5cbiAgICBjb25nYS5lbnYgPSB0cmlnZ2VyXG4gICAgR2liYmVyaXNoLmZhY3RvcnkoIGNvbmdhLCBvdXQsIFsnaW5zdHJ1bWVudHMnLCdjb25nYSddLCBwcm9wcyAgKVxuXG4gICAgcmV0dXJuIGNvbmdhXG4gIH1cbiAgXG4gIENvbmdhLmRlZmF1bHRzID0ge1xuICAgIGdhaW46IC4yNSxcbiAgICBmcmVxdWVuY3k6MTkwLFxuICAgIGRlY2F5OiAuODUsXG4gICAgbG91ZG5lc3M6IDFcbiAgfVxuXG4gIHJldHVybiBDb25nYVxuXG59XG4iLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgaW5zdHJ1bWVudCA9IHJlcXVpcmUoICcuL2luc3RydW1lbnQuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IENvd2JlbGwgPSBhcmd1bWVudFByb3BzID0+IHtcbiAgICBsZXQgY293YmVsbCA9IE9iamVjdC5jcmVhdGUoIGluc3RydW1lbnQgKVxuICAgIFxuICAgIGNvbnN0IGRlY2F5ICAgPSBnLmluKCAnZGVjYXknICksXG4gICAgICAgICAgZ2FpbiAgICA9IGcuaW4oICdnYWluJyApLFxuICAgICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApXG5cbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oIHt9LCBDb3diZWxsLmRlZmF1bHRzLCBhcmd1bWVudFByb3BzIClcblxuICAgIGNvbnN0IGJwZkN1dG9mZiA9IGcucGFyYW0oICdicGZjJywgMTAwMCApLFxuICAgICAgICAgIHMxID0gR2liYmVyaXNoLm9zY2lsbGF0b3JzLmZhY3RvcnkoICdzcXVhcmUnLCA1NjAgKSxcbiAgICAgICAgICBzMiA9IEdpYmJlcmlzaC5vc2NpbGxhdG9ycy5mYWN0b3J5KCAnc3F1YXJlJywgODQ1ICksXG4gICAgICAgICAgZWcgPSBnLmRlY2F5KCBnLm11bCggZGVjYXksIGcuZ2VuLnNhbXBsZXJhdGUgKiAyICkgKSwgXG4gICAgICAgICAgYnBmID0gZy5zdmYoIGcuYWRkKCBzMSxzMiApLCBicGZDdXRvZmYsIDMsIDIsIGZhbHNlICksXG4gICAgICAgICAgZW52QnBmID0gZy5tdWwoIGJwZiwgZWcgKSxcbiAgICAgICAgICBvdXQgPSBnLm11bCggZW52QnBmLCBnLm11bCggZ2FpbiwgbG91ZG5lc3MgKSApXG5cbiAgICBjb3diZWxsLmVudiA9IGVnIFxuXG4gICAgY293YmVsbC5pc1N0ZXJlbyA9IGZhbHNlXG5cbiAgICBjb3diZWxsID0gR2liYmVyaXNoLmZhY3RvcnkoIGNvd2JlbGwsIG91dCwgWydpbnN0cnVtZW50cycsICdjb3diZWxsJ10sIHByb3BzICApXG4gICAgXG4gICAgcmV0dXJuIGNvd2JlbGxcbiAgfVxuICBcbiAgQ293YmVsbC5kZWZhdWx0cyA9IHtcbiAgICBnYWluOiAxLFxuICAgIGRlY2F5Oi41LFxuICAgIGxvdWRuZXNzOjFcbiAgfVxuXG4gIHJldHVybiBDb3diZWxsXG5cbn1cbiIsImNvbnN0IGcgPSByZXF1aXJlKCdnZW5pc2guanMnKSxcbiAgICAgIGluc3RydW1lbnQgPSByZXF1aXJlKCcuL2luc3RydW1lbnQuanMnKTtcblxuY29uc3QgZ2VuaXNoID0gZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoR2liYmVyaXNoKSB7XG5cbiAgY29uc3QgRk0gPSBpbnB1dFByb3BzID0+IHtcbiAgICBsZXQgc3luID0gT2JqZWN0LmNyZWF0ZShpbnN0cnVtZW50KTtcblxuICAgIGxldCBmcmVxdWVuY3kgPSBnLmluKCdmcmVxdWVuY3knKSxcbiAgICAgICAgZ2xpZGUgPSBnLmluKCdnbGlkZScpLFxuICAgICAgICBzbGlkaW5nRnJlcSA9IGcuc2xpZGUoZnJlcXVlbmN5LCBnbGlkZSwgZ2xpZGUpLFxuICAgICAgICBjbVJhdGlvID0gZy5pbignY21SYXRpbycpLFxuICAgICAgICBpbmRleCA9IGcuaW4oJ2luZGV4JyksXG4gICAgICAgIGZlZWRiYWNrID0gZy5pbignZmVlZGJhY2snKSxcbiAgICAgICAgYXR0YWNrID0gZy5pbignYXR0YWNrJyksXG4gICAgICAgIGRlY2F5ID0gZy5pbignZGVjYXknKSxcbiAgICAgICAgc3VzdGFpbiA9IGcuaW4oJ3N1c3RhaW4nKSxcbiAgICAgICAgc3VzdGFpbkxldmVsID0gZy5pbignc3VzdGFpbkxldmVsJyksXG4gICAgICAgIHJlbGVhc2UgPSBnLmluKCdyZWxlYXNlJyksXG4gICAgICAgIGxvdWRuZXNzID0gZy5pbignbG91ZG5lc3MnKTtcblxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgRk0uZGVmYXVsdHMsIGlucHV0UHJvcHMpO1xuICAgIE9iamVjdC5hc3NpZ24oc3luLCBwcm9wcyk7XG5cbiAgICBzeW4uX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGVudiA9IEdpYmJlcmlzaC5lbnZlbG9wZXMuZmFjdG9yeShwcm9wcy51c2VBRFNSLCBwcm9wcy5zaGFwZSwgYXR0YWNrLCBkZWNheSwgc3VzdGFpbiwgc3VzdGFpbkxldmVsLCByZWxlYXNlLCBwcm9wcy50cmlnZ2VyUmVsZWFzZSk7XG5cbiAgICAgIGNvbnN0IGZlZWRiYWNrc3NkID0gZy5oaXN0b3J5KDApO1xuXG4gICAgICBjb25zdCBtb2RPc2MgPSBHaWJiZXJpc2gub3NjaWxsYXRvcnMuZmFjdG9yeShzeW4ubW9kdWxhdG9yV2F2ZWZvcm0sIGcuYWRkKGcubXVsKHNsaWRpbmdGcmVxLCBjbVJhdGlvKSwgZy5tdWwoZmVlZGJhY2tzc2Qub3V0LCBmZWVkYmFjaywgaW5kZXgpKSwgc3luLmFudGlhbGlhcyk7XG5cbiAgICAgIHtcbiAgICAgICAgJ3VzZSBqc2RzcCc7XG4gICAgICAgIGNvbnN0IG1vZE9zY1dpdGhJbmRleCA9IGdlbmlzaC5tdWwoZ2VuaXNoLm11bChnZW5pc2gubXVsKG1vZE9zYywgc2xpZGluZ0ZyZXEpLCBpbmRleCksIGxvdWRuZXNzKTtcbiAgICAgICAgY29uc3QgbW9kT3NjV2l0aEVudiA9IGdlbmlzaC5tdWwobW9kT3NjV2l0aEluZGV4LCBlbnYpO1xuXG4gICAgICAgIGNvbnN0IG1vZE9zY1dpdGhFbnZBdmcgPSBnZW5pc2gubXVsKC41LCBnZW5pc2guYWRkKG1vZE9zY1dpdGhFbnYsIGZlZWRiYWNrc3NkLm91dCkpO1xuXG4gICAgICAgIGZlZWRiYWNrc3NkLmluKG1vZE9zY1dpdGhFbnZBdmcpO1xuXG4gICAgICAgIGNvbnN0IGNhcnJpZXJPc2MgPSBHaWJiZXJpc2gub3NjaWxsYXRvcnMuZmFjdG9yeShzeW4uY2FycmllcldhdmVmb3JtLCBnLmFkZChzbGlkaW5nRnJlcSwgbW9kT3NjV2l0aEVudkF2ZyksIHN5bi5hbnRpYWxpYXMpO1xuICAgICAgICBjb25zdCBjYXJyaWVyT3NjV2l0aEVudiA9IGdlbmlzaC5tdWwoY2Fycmllck9zYywgZW52KTtcblxuICAgICAgICBjb25zdCBiYXNlQ3V0b2ZmRnJlcSA9IGdlbmlzaC5tdWwoZy5pbignY3V0b2ZmJyksIGZyZXF1ZW5jeSk7XG4gICAgICAgIGNvbnN0IGN1dG9mZiA9IGdlbmlzaC5tdWwoZ2VuaXNoLm11bChiYXNlQ3V0b2ZmRnJlcSwgZy5wb3coMiwgZ2VuaXNoLm11bChnLmluKCdmaWx0ZXJNdWx0JyksIGxvdWRuZXNzKSkpLCBlbnYpO1xuICAgICAgICAvL2NvbnN0IGN1dG9mZiA9IGcuYWRkKCBnLmluKCdjdXRvZmYnKSwgZy5tdWwoIGcuaW4oJ2ZpbHRlck11bHQnKSwgZW52ICkgKVxuICAgICAgICBjb25zdCBmaWx0ZXJlZE9zYyA9IEdpYmJlcmlzaC5maWx0ZXJzLmZhY3RvcnkoY2Fycmllck9zY1dpdGhFbnYsIGN1dG9mZiwgZy5pbignUScpLCBnLmluKCdzYXR1cmF0aW9uJyksIHN5bik7XG5cbiAgICAgICAgY29uc3Qgc3ludGhXaXRoR2FpbiA9IGdlbmlzaC5tdWwoZ2VuaXNoLm11bChmaWx0ZXJlZE9zYywgZy5pbignZ2FpbicpKSwgbG91ZG5lc3MpO1xuXG4gICAgICAgIGxldCBwYW5uZXI7XG4gICAgICAgIGlmIChwcm9wcy5wYW5Wb2ljZXMgPT09IHRydWUpIHtcbiAgICAgICAgICBwYW5uZXIgPSBnLnBhbihzeW50aFdpdGhHYWluLCBzeW50aFdpdGhHYWluLCBnLmluKCdwYW4nKSk7XG4gICAgICAgICAgc3luLmdyYXBoID0gW3Bhbm5lci5sZWZ0LCBwYW5uZXIucmlnaHRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN5bi5ncmFwaCA9IHN5bnRoV2l0aEdhaW47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3luLmVudiA9IGVudjtcbiAgICB9O1xuXG4gICAgc3luLl9fcmVxdWlyZXNSZWNvbXBpbGF0aW9uID0gWydjYXJyaWVyV2F2ZWZvcm0nLCAnbW9kdWxhdG9yV2F2ZWZvcm0nLCAnYW50aWFsaWFzJywgJ2ZpbHRlclR5cGUnLCAnZmlsdGVyTW9kZSddO1xuICAgIHN5bi5fX2NyZWF0ZUdyYXBoKCk7XG5cbiAgICBjb25zdCBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeShzeW4sIHN5bi5ncmFwaCwgWydpbnN0cnVtZW50cycsICdGTSddLCBwcm9wcyk7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIEZNLmRlZmF1bHRzID0ge1xuICAgIGNhcnJpZXJXYXZlZm9ybTogJ3NpbmUnLFxuICAgIG1vZHVsYXRvcldhdmVmb3JtOiAnc2luZScsXG4gICAgYXR0YWNrOiA0NCxcbiAgICBmZWVkYmFjazogMCxcbiAgICBkZWNheTogMjIwNTAsXG4gICAgc3VzdGFpbjogNDQxMDAsXG4gICAgc3VzdGFpbkxldmVsOiAuNixcbiAgICByZWxlYXNlOiAyMjA1MCxcbiAgICB1c2VBRFNSOiBmYWxzZSxcbiAgICBzaGFwZTogJ2xpbmVhcicsXG4gICAgdHJpZ2dlclJlbGVhc2U6IGZhbHNlLFxuICAgIGdhaW46IC4yNSxcbiAgICBjbVJhdGlvOiAyLFxuICAgIGluZGV4OiA1LFxuICAgIHB1bHNld2lkdGg6IC4yNSxcbiAgICBmcmVxdWVuY3k6IDIyMCxcbiAgICBwYW46IC41LFxuICAgIGFudGlhbGlhczogZmFsc2UsXG4gICAgcGFuVm9pY2VzOiBmYWxzZSxcbiAgICBnbGlkZTogMSxcbiAgICBzYXR1cmF0aW9uOiAxLFxuICAgIGZpbHRlck11bHQ6IDEuNSxcbiAgICBROiAuMjUsXG4gICAgY3V0b2ZmOiAuMzUsXG4gICAgZmlsdGVyVHlwZTogMCxcbiAgICBmaWx0ZXJNb2RlOiAwLFxuICAgIGlzTG93UGFzczogMSxcbiAgICBsb3VkbmVzczogMVxuXG4gIH07XG5cbiAgY29uc3QgUG9seUZNID0gR2liYmVyaXNoLlBvbHlUZW1wbGF0ZShGTSwgWydnbGlkZScsICdmcmVxdWVuY3knLCAnYXR0YWNrJywgJ2RlY2F5JywgJ3B1bHNld2lkdGgnLCAncGFuJywgJ2dhaW4nLCAnY21SYXRpbycsICdpbmRleCcsICdzYXR1cmF0aW9uJywgJ2ZpbHRlck11bHQnLCAnUScsICdjdXRvZmYnLCAnYW50aWFsaWFzJywgJ2ZpbHRlclR5cGUnLCAnY2FycmllcldhdmVmb3JtJywgJ21vZHVsYXRvcldhdmVmb3JtJywgJ2ZpbHRlck1vZGUnLCAnZmVlZGJhY2snLCAndXNlQURTUicsICdzdXN0YWluJywgJ3JlbGVhc2UnLCAnc3VzdGFpbkxldmVsJ10pO1xuICBQb2x5Rk0uZGVmYXVsdHMgPSBGTS5kZWZhdWx0cztcblxuICByZXR1cm4gW0ZNLCBQb2x5Rk1dO1xufTsiLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgaW5zdHJ1bWVudCA9IHJlcXVpcmUoICcuL2luc3RydW1lbnQuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGxldCBIYXQgPSBhcmd1bWVudFByb3BzID0+IHtcbiAgICBsZXQgaGF0ID0gT2JqZWN0LmNyZWF0ZSggaW5zdHJ1bWVudCApLFxuICAgICAgICB0dW5lICA9IGcuaW4oICd0dW5lJyApLFxuICAgICAgICBzY2FsZWRUdW5lID0gZy5tZW1vKCBnLmFkZCggLjQsIHR1bmUgKSApLFxuICAgICAgICBkZWNheSAgPSBnLmluKCAnZGVjYXknICksXG4gICAgICAgIGdhaW4gID0gZy5pbiggJ2dhaW4nICksXG4gICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApXG5cbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgSGF0LmRlZmF1bHRzLCBhcmd1bWVudFByb3BzIClcblxuICAgIGxldCBiYXNlRnJlcSA9IGcubXVsKCAzMjUsIHNjYWxlZFR1bmUgKSwgLy8gcmFuZ2Ugb2YgMTYyLjUgLSA0ODcuNVxuICAgICAgICBicGZDdXRvZmYgPSBnLm11bCggZy5wYXJhbSggJ2JwZmMnLCA3MDAwICksIHNjYWxlZFR1bmUgKSxcbiAgICAgICAgaHBmQ3V0b2ZmID0gZy5tdWwoIGcucGFyYW0oICdocGZjJywgMTEwMDAgKSwgc2NhbGVkVHVuZSApLCAgXG4gICAgICAgIHMxID0gR2liYmVyaXNoLm9zY2lsbGF0b3JzLmZhY3RvcnkoICdzcXVhcmUnLCBiYXNlRnJlcSwgZmFsc2UgKSxcbiAgICAgICAgczIgPSBHaWJiZXJpc2gub3NjaWxsYXRvcnMuZmFjdG9yeSggJ3NxdWFyZScsIGcubXVsKCBiYXNlRnJlcSwxLjQ0NzEgKSApLFxuICAgICAgICBzMyA9IEdpYmJlcmlzaC5vc2NpbGxhdG9ycy5mYWN0b3J5KCAnc3F1YXJlJywgZy5tdWwoIGJhc2VGcmVxLDEuNjE3MCApICksXG4gICAgICAgIHM0ID0gR2liYmVyaXNoLm9zY2lsbGF0b3JzLmZhY3RvcnkoICdzcXVhcmUnLCBnLm11bCggYmFzZUZyZXEsMS45MjY1ICkgKSxcbiAgICAgICAgczUgPSBHaWJiZXJpc2gub3NjaWxsYXRvcnMuZmFjdG9yeSggJ3NxdWFyZScsIGcubXVsKCBiYXNlRnJlcSwyLjUwMjggKSApLFxuICAgICAgICBzNiA9IEdpYmJlcmlzaC5vc2NpbGxhdG9ycy5mYWN0b3J5KCAnc3F1YXJlJywgZy5tdWwoIGJhc2VGcmVxLDIuNjYzNyApICksXG4gICAgICAgIHN1bSA9IGcuYWRkKCBzMSxzMixzMyxzNCxzNSxzNiApLFxuICAgICAgICBlZyA9IGcuZGVjYXkoIGcubXVsKCBkZWNheSwgZy5nZW4uc2FtcGxlcmF0ZSAqIDIgKSwgeyBpbml0VmFsdWU6MCB9KSwgXG4gICAgICAgIGJwZiA9IGcuc3ZmKCBzdW0sIGJwZkN1dG9mZiwgLjUsIDIsIGZhbHNlICksXG4gICAgICAgIGVudkJwZiA9IGcubXVsKCBicGYsIGVnICksXG4gICAgICAgIGhwZiA9IGcuZmlsdGVyMjQoIGVudkJwZiwgMCwgaHBmQ3V0b2ZmLCAwICksXG4gICAgICAgIG91dCA9IGcubXVsKCBocGYsIGcubXVsKCBnYWluLCBsb3VkbmVzcyApIClcblxuICAgIGhhdC5lbnYgPSBlZyBcbiAgICBoYXQuaXNTdGVyZW8gPSBmYWxzZVxuXG4gICAgY29uc3QgX19oYXQgPSBHaWJiZXJpc2guZmFjdG9yeSggaGF0LCBvdXQsIFsnaW5zdHJ1bWVudHMnLCdoYXQnXSwgcHJvcHMgIClcbiAgICBcblxuICAgIHJldHVybiBfX2hhdFxuICB9XG4gIFxuICBIYXQuZGVmYXVsdHMgPSB7XG4gICAgZ2FpbjogIC41LFxuICAgIHR1bmU6IC42LFxuICAgIGRlY2F5Oi4xLFxuICAgIGxvdWRuZXNzOjFcbiAgfVxuXG4gIHJldHVybiBIYXRcblxufVxuIiwiY29uc3QgdWdlbiA9IHJlcXVpcmUoICcuLi91Z2VuLmpzJyApKClcblxuY29uc3QgaW5zdHJ1bWVudCA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuXG5PYmplY3QuYXNzaWduKCBpbnN0cnVtZW50LCB7XG4gIHR5cGU6J2luc3RydW1lbnQnLFxuXG4gIG5vdGUoIGZyZXEsIGxvdWRuZXNzPW51bGwgKSB7XG4gICAgLy8gaWYgYmlub3AgaXMgc2hvdWxkIGJlIHVzZWQuLi5cbiAgICBpZiggaXNOYU4oIHRoaXMuZnJlcXVlbmN5ICkgKSB7IFxuICAgICAgLy8gYW5kIGlmIHdlIGFyZSBhc3NpZ25pbmcgYmlub3AgZm9yIHRoZSBmaXJzdCB0aW1lLi4uXG4gICAgICBpZiggdGhpcy5mcmVxdWVuY3kuaXNvcCAhPT0gdHJ1ZSApIHtcbiAgICAgICAgbGV0IG9iaiA9IEdpYmJlcmlzaC5wcm9jZXNzb3IudWdlbnMuZ2V0KCB0aGlzLmZyZXF1ZW5jeS5pZCApXG4gICAgICAgIG9iai5pbnB1dHNbMF0gPSBmcmVxXG4gICAgICAgIHRoaXMuZnJlcXVlbmN5ID0gb2JqXG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5mcmVxdWVuY3kuaW5wdXRzWzBdID0gZnJlcVxuICAgICAgICBHaWJiZXJpc2guZGlydHkoIHRoaXMgKVxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgdGhpcy5mcmVxdWVuY3kgPSBmcmVxXG4gICAgfVxuXG4gICAgaWYoIGxvdWRuZXNzICE9PSBudWxsICkgdGhpcy5sb3VkbmVzcyA9IGxvdWRuZXNzIFxuXG4gICAgdGhpcy5lbnYudHJpZ2dlcigpXG4gIH0sXG5cbiAgdHJpZ2dlciggbG91ZG5lc3MgPSAxICkge1xuICAgIHRoaXMubG91ZG5lc3MgPSBsb3VkbmVzc1xuICAgIHRoaXMuZW52LnRyaWdnZXIoKVxuICB9LFxuXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3RydW1lbnRcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuY29uc3QgaW5zdHJ1bWVudHMgPSB7XG4gIEtpY2sgICAgICAgIDogcmVxdWlyZSggJy4va2ljay5qcycgKSggR2liYmVyaXNoICksXG4gIENvbmdhICAgICAgIDogcmVxdWlyZSggJy4vY29uZ2EuanMnICkoIEdpYmJlcmlzaCApLFxuICBDbGF2ZSAgICAgICA6IHJlcXVpcmUoICcuL2NvbmdhLmpzJyApKCBHaWJiZXJpc2ggKSwgLy8gY2xhdmUgaXMgc2FtZSBhcyBjb25nYSB3aXRoIGRpZmZlcmVudCBkZWZhdWx0cywgc2VlIGJlbG93XG4gIEhhdCAgICAgICAgIDogcmVxdWlyZSggJy4vaGF0LmpzJyApKCBHaWJiZXJpc2ggKSxcbiAgU25hcmUgICAgICAgOiByZXF1aXJlKCAnLi9zbmFyZS5qcycgKSggR2liYmVyaXNoICksXG4gIENvd2JlbGwgICAgIDogcmVxdWlyZSggJy4vY293YmVsbC5qcycgKSggR2liYmVyaXNoICksXG4gIFRvbSAgICAgICAgIDogcmVxdWlyZSggJy4vdG9tLmpzJyApKCBHaWJiZXJpc2ggKVxufVxuXG5pbnN0cnVtZW50cy5DbGF2ZS5kZWZhdWx0cy5mcmVxdWVuY3kgPSAyNTAwXG5pbnN0cnVtZW50cy5DbGF2ZS5kZWZhdWx0cy5kZWNheSA9IC41O1xuXG5bIGluc3RydW1lbnRzLlN5bnRoLCBpbnN0cnVtZW50cy5Qb2x5U3ludGggXSAgICAgPSByZXF1aXJlKCAnLi9zeW50aC5qcycgKSggR2liYmVyaXNoICk7XG5bIGluc3RydW1lbnRzLk1vbm9zeW50aCwgaW5zdHJ1bWVudHMuUG9seU1vbm8gXSAgPSByZXF1aXJlKCAnLi9tb25vc3ludGguanMnICkoIEdpYmJlcmlzaCApO1xuWyBpbnN0cnVtZW50cy5GTSwgaW5zdHJ1bWVudHMuUG9seUZNIF0gICAgICAgICAgID0gcmVxdWlyZSggJy4vZm0uanMnICkoIEdpYmJlcmlzaCApO1xuWyBpbnN0cnVtZW50cy5TYW1wbGVyLCBpbnN0cnVtZW50cy5Qb2x5U2FtcGxlciBdID0gcmVxdWlyZSggJy4vc2FtcGxlci5qcycgKSggR2liYmVyaXNoICk7XG5bIGluc3RydW1lbnRzLkthcnBsdXMsIGluc3RydW1lbnRzLlBvbHlLYXJwbHVzIF0gPSByZXF1aXJlKCAnLi9rYXJwbHVzc3Ryb25nLmpzJyApKCBHaWJiZXJpc2ggKTtcblxuaW5zdHJ1bWVudHMuZXhwb3J0ID0gdGFyZ2V0ID0+IHtcbiAgZm9yKCBsZXQga2V5IGluIGluc3RydW1lbnRzICkge1xuICAgIGlmKCBrZXkgIT09ICdleHBvcnQnICkge1xuICAgICAgdGFyZ2V0WyBrZXkgXSA9IGluc3RydW1lbnRzWyBrZXkgXVxuICAgIH1cbiAgfVxufVxuXG5yZXR1cm4gaW5zdHJ1bWVudHNcblxufVxuIiwiY29uc3QgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgICBpbnN0cnVtZW50ID0gcmVxdWlyZSggJy4vaW5zdHJ1bWVudC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbiAgY29uc3QgS2FycGx1cyA9IGlucHV0UHJvcHMgPT4ge1xuXG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgS2FycGx1cy5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgbGV0IHN5biA9IE9iamVjdC5jcmVhdGUoIGluc3RydW1lbnQgKVxuICAgIFxuICAgIGxldCBzYW1wbGVSYXRlID0gR2liYmVyaXNoLmN0eC5zYW1wbGVSYXRlIFxuXG4gICAgY29uc3QgdHJpZ2dlciA9IGcuYmFuZygpLFxuICAgICAgICAgIC8vIGhpZ2ggaW5pdGlhbFZhbHVlIHN0b3BzIHRyaWdnZXJpbmcgb24gaW5pdGlhbGl6YXRpb25cbiAgICAgICAgICBwaGFzZSA9IGcuYWNjdW0oIDEsIHRyaWdnZXIsIHsgc2hvdWxkV3JhcE1heDpmYWxzZSwgaW5pdGlhbFZhbHVlOjEwMDAwMDAgfSApLFxuICAgICAgICAgIGVudiA9IGcuZ3RwKCBnLnN1YiggMSwgZy5kaXYoIHBoYXNlLCAyMDAgKSApLCAwICksXG4gICAgICAgICAgaW1wdWxzZSA9IGcubXVsKCBnLm5vaXNlKCksIGVudiApLFxuICAgICAgICAgIGZlZWRiYWNrID0gZy5oaXN0b3J5KCksXG4gICAgICAgICAgZnJlcXVlbmN5ID0gZy5pbignZnJlcXVlbmN5JyksXG4gICAgICAgICAgZ2xpZGUgPSBnLmluKCAnZ2xpZGUnICksXG4gICAgICAgICAgc2xpZGluZ0ZyZXF1ZW5jeSA9IGcuc2xpZGUoIGZyZXF1ZW5jeSwgZ2xpZGUsIGdsaWRlICksXG4gICAgICAgICAgZGVsYXkgPSBnLmRlbGF5KCBnLmFkZCggaW1wdWxzZSwgZmVlZGJhY2sub3V0ICksIGcuZGl2KCBzYW1wbGVSYXRlLCBzbGlkaW5nRnJlcXVlbmN5ICkpLFxuICAgICAgICAgIGRlY2F5ZWQgPSBnLm11bCggZGVsYXksIGcudDYwKCBnLm11bCggZy5pbignZGVjYXknKSwgc2xpZGluZ0ZyZXF1ZW5jeSApICkgKSxcbiAgICAgICAgICBkYW1wZWQgPSAgZy5taXgoIGRlY2F5ZWQsIGZlZWRiYWNrLm91dCwgZy5pbignZGFtcGluZycpICksXG4gICAgICAgICAgbiA9IGcubm9pc2UoKSxcbiAgICAgICAgICBibGVuZFZhbHVlID0gZy5zd2l0Y2goIGcuZ3QoIG4sIGcuaW4oJ2JsZW5kJykgKSwgLTEsIDEgKSwgXG4gICAgICAgICAgd2l0aEdhaW4gPSBnLm11bCggZy5tdWwoIGJsZW5kVmFsdWUsIGRhbXBlZCApLCBnLm11bCggZy5pbignbG91ZG5lc3MnKSwgZy5pbignZ2FpbicpICkgKVxuXG4gICAgZmVlZGJhY2suaW4oIGRhbXBlZCApXG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gT2JqZWN0LmFzc2lnbigge30sIEthcnBsdXMuZGVmYXVsdHMsIHByb3BzIClcblxuICAgIE9iamVjdC5hc3NpZ24oIHN5biwge1xuICAgICAgcHJvcGVydGllcyA6IHByb3BzLFxuXG4gICAgICBlbnYgOiB0cmlnZ2VyLFxuICAgICAgcGhhc2UsXG5cbiAgICAgIGdldFBoYXNlKCkge1xuICAgICAgICByZXR1cm4gR2liYmVyaXNoLm1lbW9yeS5oZWFwWyBwaGFzZS5tZW1vcnkudmFsdWUuaWR4IF1cbiAgICAgIH0sXG4gICAgfSlcblxuICAgIGlmKCBwcm9wZXJ0aWVzLnBhblZvaWNlcyApIHsgIFxuICAgICAgY29uc3QgcGFubmVyID0gZy5wYW4oIHdpdGhHYWluLCB3aXRoR2FpbiwgZy5pbiggJ3BhbicgKSApXG4gICAgICBzeW4gPSBHaWJiZXJpc2guZmFjdG9yeSggc3luLCBbcGFubmVyLmxlZnQsIHBhbm5lci5yaWdodF0sIFsnaW5zdHJ1bWVudHMnLCdrYXJwbHVzJ10sIHByb3BzICApXG4gICAgfWVsc2V7XG4gICAgICBzeW4gPSBHaWJiZXJpc2guZmFjdG9yeSggc3luLCB3aXRoR2FpbiwgWydpbnN0cnVtZW50cycsJ2thcnBsdXMnXSwgcHJvcHMgKVxuICAgIH1cblxuICAgIHJldHVybiBzeW5cbiAgfVxuICBcbiAgS2FycGx1cy5kZWZhdWx0cyA9IHtcbiAgICBkZWNheTogLjk3LFxuICAgIGRhbXBpbmc6LjIsXG4gICAgZ2FpbjogLjE1LFxuICAgIGZyZXF1ZW5jeToyMjAsXG4gICAgcGFuOiAuNSxcbiAgICBnbGlkZToxLFxuICAgIHBhblZvaWNlczpmYWxzZSxcbiAgICBsb3VkbmVzczoxLFxuICAgIGJsZW5kOjFcbiAgfVxuXG4gIGxldCBlbnZDaGVja0ZhY3RvcnkgPSAoIHN5bixzeW50aCApID0+IHtcbiAgICBsZXQgZW52Q2hlY2sgPSAoKT0+IHtcbiAgICAgIGxldCBwaGFzZSA9IHN5bi5nZXRQaGFzZSgpLFxuICAgICAgICAgIGVuZFRpbWUgPSBzeW50aC5kZWNheSAqIHNhbXBsZVJhdGVcblxuICAgICAgaWYoIHBoYXNlID4gZW5kVGltZSApIHtcbiAgICAgICAgc3ludGguZGlzY29ubmVjdFVnZW4oIHN5biApXG4gICAgICAgIHN5bi5pc0Nvbm5lY3RlZCA9IGZhbHNlXG4gICAgICAgIEdpYmJlcmlzaC5tZW1vcnkuaGVhcFsgc3luLnBoYXNlLm1lbW9yeS52YWx1ZS5pZHggXSA9IDAgLy8gdHJpZ2dlciBkb2Vzbid0IHNlZW0gdG8gcmVzZXQgZm9yIHNvbWUgcmVhc29uXG4gICAgICB9ZWxzZXtcbiAgICAgICAgR2liYmVyaXNoLmJsb2NrQ2FsbGJhY2tzLnB1c2goIGVudkNoZWNrIClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGVudkNoZWNrXG4gIH1cblxuICBjb25zdCBQb2x5S2FycGx1cyA9IEdpYmJlcmlzaC5Qb2x5VGVtcGxhdGUoIEthcnBsdXMsIFsnZnJlcXVlbmN5JywnZGVjYXknLCdkYW1waW5nJywncGFuJywnZ2FpbicsICdnbGlkZSddLCBlbnZDaGVja0ZhY3RvcnkgKSBcbiAgUG9seUthcnBsdXMuZGVmYXVsdHMgPSBLYXJwbHVzLmRlZmF1bHRzXG5cbiAgcmV0dXJuIFsgS2FycGx1cywgUG9seUthcnBsdXMgXVxuXG59XG4iLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgaW5zdHJ1bWVudCA9IHJlcXVpcmUoICcuL2luc3RydW1lbnQuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IEtpY2sgPSBpbnB1dFByb3BzID0+IHtcbiAgICAvLyBlc3RhYmxpc2ggcHJvdG90eXBlIGNoYWluXG4gICAgY29uc3Qga2ljayA9IE9iamVjdC5jcmVhdGUoIGluc3RydW1lbnQgKVxuXG4gICAgLy8gZGVmaW5lIGlucHV0c1xuICAgIGNvbnN0IGZyZXF1ZW5jeSA9IGcuaW4oICdmcmVxdWVuY3knICksXG4gICAgICAgICAgZGVjYXkgPSBnLmluKCAnZGVjYXknICksXG4gICAgICAgICAgdG9uZSAgPSBnLmluKCAndG9uZScgKSxcbiAgICAgICAgICBnYWluICA9IGcuaW4oICdnYWluJyApLFxuICAgICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApXG4gICAgXG4gICAgLy8gY3JlYXRlIGluaXRpYWwgcHJvcGVydHkgc2V0XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgS2ljay5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgT2JqZWN0LmFzc2lnbigga2ljaywgcHJvcHMgKVxuXG4gICAgLy8gY3JlYXRlIERTUCBncmFwaFxuICAgIGNvbnN0IHRyaWdnZXIgPSBnLmJhbmcoKSxcbiAgICAgICAgICBpbXB1bHNlID0gZy5tdWwoIHRyaWdnZXIsIDYwICksXG4gICAgICAgICAgc2NhbGVkRGVjYXkgPSBnLnN1YiggMS4wMDUsIGRlY2F5ICksIC8vIC0+IHJhbmdlIHsgLjAwNSwgMS4wMDUgfVxuICAgICAgICAgIHNjYWxlZFRvbmUgPSBnLmFkZCggNTAsIGcubXVsKCB0b25lLCBnLm11bCg0MDAwLCBsb3VkbmVzcykgKSApLCAvLyAtPiByYW5nZSB7IDUwLCA0MDUwIH1cbiAgICAgICAgICBicGYgPSBnLnN2ZiggaW1wdWxzZSwgZnJlcXVlbmN5LCBzY2FsZWREZWNheSwgMiwgZmFsc2UgKSxcbiAgICAgICAgICBscGYgPSBnLnN2ZiggYnBmLCBzY2FsZWRUb25lLCAuNSwgMCwgZmFsc2UgKSxcbiAgICAgICAgICBncmFwaCA9IGcubXVsKCBscGYsIGcubXVsKGdhaW4sIGxvdWRuZXNzKSApXG4gICAgXG4gICAga2ljay5lbnYgPSB0cmlnZ2VyXG4gICAgY29uc3Qgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIGtpY2ssIGdyYXBoLCBbJ2luc3RydW1lbnRzJywna2ljayddLCBwcm9wcyAgKVxuXG4gICAgcmV0dXJuIG91dFxuICB9XG4gIFxuICBLaWNrLmRlZmF1bHRzID0ge1xuICAgIGdhaW46IDEsXG4gICAgZnJlcXVlbmN5Ojg1LFxuICAgIHRvbmU6IC4yNSxcbiAgICBkZWNheTouOSxcbiAgICBsb3VkbmVzczoxXG4gIH1cblxuICByZXR1cm4gS2lja1xuXG59XG4iLCJjb25zdCBnID0gcmVxdWlyZSgnZ2VuaXNoLmpzJyksXG4gICAgICBpbnN0cnVtZW50ID0gcmVxdWlyZSgnLi9pbnN0cnVtZW50LmpzJyksXG4gICAgICBmZWVkYmFja09zYyA9IHJlcXVpcmUoJy4uL29zY2lsbGF0b3JzL2ZtZmVlZGJhY2tvc2MuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoR2liYmVyaXNoKSB7XG5cbiAgY29uc3QgTW9ubyA9IGFyZ3VtZW50UHJvcHMgPT4ge1xuICAgIGNvbnN0IHN5biA9IE9iamVjdC5jcmVhdGUoaW5zdHJ1bWVudCksXG4gICAgICAgICAgb3NjcyA9IFtdLFxuICAgICAgICAgIGZyZXF1ZW5jeSA9IGcuaW4oJ2ZyZXF1ZW5jeScpLFxuICAgICAgICAgIGdsaWRlID0gZy5pbignZ2xpZGUnKSxcbiAgICAgICAgICBzbGlkaW5nRnJlcSA9IGcubWVtbyhnLnNsaWRlKGZyZXF1ZW5jeSwgZ2xpZGUsIGdsaWRlKSksXG4gICAgICAgICAgYXR0YWNrID0gZy5pbignYXR0YWNrJyksXG4gICAgICAgICAgZGVjYXkgPSBnLmluKCdkZWNheScpLFxuICAgICAgICAgIHN1c3RhaW4gPSBnLmluKCdzdXN0YWluJyksXG4gICAgICAgICAgc3VzdGFpbkxldmVsID0gZy5pbignc3VzdGFpbkxldmVsJyksXG4gICAgICAgICAgcmVsZWFzZSA9IGcuaW4oJ3JlbGVhc2UnKSxcbiAgICAgICAgICBsb3VkbmVzcyA9IGcuaW4oJ2xvdWRuZXNzJyk7XG5cbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIE1vbm8uZGVmYXVsdHMsIGFyZ3VtZW50UHJvcHMpO1xuICAgIE9iamVjdC5hc3NpZ24oc3luLCBwcm9wcyk7XG5cbiAgICBzeW4uX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IGVudiA9IEdpYmJlcmlzaC5lbnZlbG9wZXMuZmFjdG9yeShwcm9wcy51c2VBRFNSLCBwcm9wcy5zaGFwZSwgYXR0YWNrLCBkZWNheSwgc3VzdGFpbiwgc3VzdGFpbkxldmVsLCByZWxlYXNlLCBwcm9wcy50cmlnZ2VyUmVsZWFzZSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGxldCBvc2MsIGZyZXE7XG5cbiAgICAgICAgc3dpdGNoIChpKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgZnJlcSA9IGcuYWRkKHNsaWRpbmdGcmVxLCBnLm11bChzbGlkaW5nRnJlcSwgZy5pbignZGV0dW5lMicpKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBmcmVxID0gZy5hZGQoc2xpZGluZ0ZyZXEsIGcubXVsKHNsaWRpbmdGcmVxLCBnLmluKCdkZXR1bmUzJykpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBmcmVxID0gc2xpZGluZ0ZyZXE7XG4gICAgICAgIH1cblxuICAgICAgICBvc2MgPSBHaWJiZXJpc2gub3NjaWxsYXRvcnMuZmFjdG9yeShzeW4ud2F2ZWZvcm0sIGZyZXEsIHN5bi5hbnRpYWxpYXMpO1xuXG4gICAgICAgIG9zY3NbaV0gPSBvc2M7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9zY1N1bSA9IGcuYWRkKC4uLm9zY3MpLFxuICAgICAgICAgICAgb3NjV2l0aEVudiA9IGcubXVsKG9zY1N1bSwgZW52KSxcbiAgICAgICAgICAgIGJhc2VDdXRvZmZGcmVxID0gZy5tdWwoZy5pbignY3V0b2ZmJyksIGZyZXF1ZW5jeSksXG4gICAgICAgICAgICBjdXRvZmYgPSBnLm11bChnLm11bChiYXNlQ3V0b2ZmRnJlcSwgZy5wb3coMiwgZy5tdWwoZy5pbignZmlsdGVyTXVsdCcpLCBsb3VkbmVzcykpKSwgZW52KSxcbiAgICAgICAgICAgIGZpbHRlcmVkT3NjID0gR2liYmVyaXNoLmZpbHRlcnMuZmFjdG9yeShvc2NXaXRoRW52LCBjdXRvZmYsIGcuaW4oJ1EnKSwgZy5pbignc2F0dXJhdGlvbicpLCBzeW4pO1xuXG4gICAgICBpZiAocHJvcHMucGFuVm9pY2VzKSB7XG4gICAgICAgIGNvbnN0IHBhbm5lciA9IGcucGFuKGZpbHRlcmVkT3NjLCBmaWx0ZXJlZE9zYywgZy5pbigncGFuJykpO1xuICAgICAgICBzeW4uZ3JhcGggPSBbZy5tdWwocGFubmVyLmxlZnQsIGcuaW4oJ2dhaW4nKSwgbG91ZG5lc3MpLCBnLm11bChwYW5uZXIucmlnaHQsIGcuaW4oJ2dhaW4nKSwgbG91ZG5lc3MpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN5bi5ncmFwaCA9IGcubXVsKGZpbHRlcmVkT3NjLCBnLmluKCdnYWluJyksIGxvdWRuZXNzKTtcbiAgICAgIH1cblxuICAgICAgc3luLmVudiA9IGVudjtcbiAgICB9O1xuXG4gICAgc3luLl9fcmVxdWlyZXNSZWNvbXBpbGF0aW9uID0gWyd3YXZlZm9ybScsICdhbnRpYWxpYXMnLCAnZmlsdGVyVHlwZScsICdmaWx0ZXJNb2RlJ107XG4gICAgc3luLl9fY3JlYXRlR3JhcGgoKTtcblxuICAgIGNvbnN0IG91dCA9IEdpYmJlcmlzaC5mYWN0b3J5KHN5biwgc3luLmdyYXBoLCBbJ2luc3RydW1lbnRzJywgJ01vbm9zeW50aCddLCBwcm9wcyk7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIE1vbm8uZGVmYXVsdHMgPSB7XG4gICAgd2F2ZWZvcm06ICdzYXcnLFxuICAgIGF0dGFjazogNDQsXG4gICAgZGVjYXk6IDIyMDUwLFxuICAgIHN1c3RhaW46IDQ0MTAwLFxuICAgIHN1c3RhaW5MZXZlbDogLjYsXG4gICAgcmVsZWFzZTogMjIwNTAsXG4gICAgdXNlQURTUjogZmFsc2UsXG4gICAgc2hhcGU6ICdsaW5lYXInLFxuICAgIHRyaWdnZXJSZWxlYXNlOiBmYWxzZSxcbiAgICBnYWluOiAuMjUsXG4gICAgcHVsc2V3aWR0aDogLjI1LFxuICAgIGZyZXF1ZW5jeTogMjIwLFxuICAgIHBhbjogLjUsXG4gICAgZGV0dW5lMjogLjAwNSxcbiAgICBkZXR1bmUzOiAtLjAwNSxcbiAgICBjdXRvZmY6IDEsXG4gICAgcmVzb25hbmNlOiAuMjUsXG4gICAgUTogLjUsXG4gICAgcGFuVm9pY2VzOiBmYWxzZSxcbiAgICBnbGlkZTogMSxcbiAgICBhbnRpYWxpYXM6IGZhbHNlLFxuICAgIGZpbHRlclR5cGU6IDEsXG4gICAgZmlsdGVyTW9kZTogMCwgLy8gMCA9IExQLCAxID0gSFAsIDIgPSBCUCwgMyA9IE5vdGNoXG4gICAgc2F0dXJhdGlvbjogLjUsXG4gICAgZmlsdGVyTXVsdDogNCxcbiAgICBpc0xvd1Bhc3M6IHRydWUsXG4gICAgbG91ZG5lc3M6IDFcbiAgfTtcblxuICBsZXQgUG9seU1vbm8gPSBHaWJiZXJpc2guUG9seVRlbXBsYXRlKE1vbm8sIFsnZnJlcXVlbmN5JywgJ2F0dGFjaycsICdkZWNheScsICdjdXRvZmYnLCAnUScsICdkZXR1bmUyJywgJ2RldHVuZTMnLCAncHVsc2V3aWR0aCcsICdwYW4nLCAnZ2FpbicsICdnbGlkZScsICdzYXR1cmF0aW9uJywgJ2ZpbHRlck11bHQnLCAnYW50aWFsaWFzJywgJ2ZpbHRlclR5cGUnLCAnd2F2ZWZvcm0nLCAnZmlsdGVyTW9kZSddKTtcbiAgUG9seU1vbm8uZGVmYXVsdHMgPSBNb25vLmRlZmF1bHRzO1xuXG4gIHJldHVybiBbTW9ubywgUG9seU1vbm9dO1xufTsiLCIvLyBYWFggVE9PIE1BTlkgR0xPQkFMIEdJQkJFUklTSCBWQUxVRVNcblxuY29uc3QgR2liYmVyaXNoID0gcmVxdWlyZSggJy4uL2luZGV4LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBub3RlKCBmcmVxLCBnYWluICkge1xuICAgIC8vIHdpbGwgYmUgc2VudCB0byBwcm9jZXNzb3Igbm9kZSB2aWEgcHJveHkgbWV0aG9kLi4uXG4gICAgaWYoIEdpYmJlcmlzaC5tb2RlICE9PSAnd29ya2xldCcgKSB7XG4gICAgICBsZXQgdm9pY2UgPSB0aGlzLl9fZ2V0Vm9pY2VfXygpXG4gICAgICAvL09iamVjdC5hc3NpZ24oIHZvaWNlLCB0aGlzLnByb3BlcnRpZXMgKVxuICAgICAgaWYoIGdhaW4gPT09IHVuZGVmaW5lZCApIGdhaW4gPSB0aGlzLmdhaW5cbiAgICAgIHZvaWNlLmdhaW4gPSBnYWluXG4gICAgICB2b2ljZS5ub3RlKCBmcmVxIClcbiAgICAgIHRoaXMuX19ydW5Wb2ljZV9fKCB2b2ljZSwgdGhpcyApXG4gICAgICB0aGlzLnRyaWdnZXJOb3RlID0gZnJlcVxuICAgIH1cbiAgfSxcblxuICAvLyBYWFggdGhpcyBpcyBub3QgcGFydGljdWxhcmx5IHNhdGlzZnlpbmcuLi5cbiAgLy8gbXVzdCBjaGVjayBmb3IgYm90aCBub3RlcyBhbmQgY2hvcmRzXG4gIHRyaWdnZXIoIGdhaW4gKSB7XG4gICAgaWYoIHRoaXMudHJpZ2dlckNob3JkICE9PSBudWxsICkge1xuICAgICAgdGhpcy50cmlnZ2VyQ2hvcmQuZm9yRWFjaCggdiA9PiB7XG4gICAgICAgIGxldCB2b2ljZSA9IHRoaXMuX19nZXRWb2ljZV9fKClcbiAgICAgICAgT2JqZWN0LmFzc2lnbiggdm9pY2UsIHRoaXMucHJvcGVydGllcyApXG4gICAgICAgIHZvaWNlLm5vdGUoIHYgKVxuICAgICAgICB2b2ljZS5nYWluID0gZ2FpblxuICAgICAgICB0aGlzLl9fcnVuVm9pY2VfXyggdm9pY2UsIHRoaXMgKVxuICAgICAgfSlcbiAgICB9ZWxzZSBpZiggdGhpcy50cmlnZ2VyTm90ZSAhPT0gbnVsbCApIHtcbiAgICAgIGxldCB2b2ljZSA9IHRoaXMuX19nZXRWb2ljZV9fKClcbiAgICAgIE9iamVjdC5hc3NpZ24oIHZvaWNlLCB0aGlzLnByb3BlcnRpZXMgKVxuICAgICAgdm9pY2Uubm90ZSggdGhpcy50cmlnZ2VyTm90ZSApXG4gICAgICB2b2ljZS5nYWluID0gZ2FpblxuICAgICAgdGhpcy5fX3J1blZvaWNlX18oIHZvaWNlLCB0aGlzIClcbiAgICB9ZWxzZXtcbiAgICAgIGxldCB2b2ljZSA9IHRoaXMuX19nZXRWb2ljZV9fKClcbiAgICAgIE9iamVjdC5hc3NpZ24oIHZvaWNlLCB0aGlzLnByb3BlcnRpZXMgKVxuICAgICAgdm9pY2UudHJpZ2dlciggZ2FpbiApXG4gICAgICB0aGlzLl9fcnVuVm9pY2VfXyggdm9pY2UsIHRoaXMgKVxuICAgIH1cbiAgfSxcblxuICBfX3J1blZvaWNlX18oIHZvaWNlLCBfcG9seSApIHtcbiAgICBpZiggIXZvaWNlLmlzQ29ubmVjdGVkICkge1xuICAgICAgdm9pY2UuY29ubmVjdCggX3BvbHkgKVxuICAgICAgdm9pY2UuaXNDb25uZWN0ZWQgPSB0cnVlXG4gICAgfVxuXG4gICAgbGV0IGVudkNoZWNrXG4gICAgaWYoIF9wb2x5LmVudkNoZWNrID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBlbnZDaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiggdm9pY2UuZW52LmlzQ29tcGxldGUoKSApIHtcbiAgICAgICAgICBfcG9seS5kaXNjb25uZWN0VWdlbiggdm9pY2UgKVxuICAgICAgICAgIHZvaWNlLmlzQ29ubmVjdGVkID0gZmFsc2VcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgR2liYmVyaXNoLmJsb2NrQ2FsbGJhY2tzLnB1c2goIGVudkNoZWNrIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgZW52Q2hlY2sgPSBfcG9seS5lbnZDaGVjayggdm9pY2UsIF9wb2x5IClcbiAgICB9XG5cbiAgICAvLyBYWFggdW5jb21tZW50IHRoaXMgbGluZSB0byB0dXJuIG9uIGR5bmFtaWNhbGx5IGNvbm5lY3RpbmdcbiAgICAvLyBkaXNjb25uZWN0aW5nIGluZGl2aWR1YWwgdm9pY2VzIGZyb20gZ3JhcGhcbiAgICAvL0dpYmJlcmlzaC5ibG9ja0NhbGxiYWNrcy5wdXNoKCBlbnZDaGVjayApXG4gIH0sXG5cbiAgX19nZXRWb2ljZV9fKCkge1xuICAgIHJldHVybiB0aGlzLnZvaWNlc1sgdGhpcy52b2ljZUNvdW50KysgJSB0aGlzLnZvaWNlcy5sZW5ndGggXVxuICB9LFxuXG4gIGNob3JkKCBmcmVxdWVuY2llcyApIHtcbiAgICAvLyB3aWxsIGJlIHNlbnQgdG8gcHJvY2Vzc29yIG5vZGUgdmlhIHByb3h5IG1ldGhvZC4uLlxuICAgIGlmKCBHaWJiZXJpc2ggIT09IHVuZGVmaW5lZCAmJiBHaWJiZXJpc2gubW9kZSAhPT0gJ3dvcmtsZXQnICkge1xuICAgICAgZnJlcXVlbmNpZXMuZm9yRWFjaCggdiA9PiB0aGlzLm5vdGUoIHYgKSApXG4gICAgICB0aGlzLnRyaWdnZXJDaG9yZCA9IGZyZXF1ZW5jaWVzXG4gICAgfVxuICB9LFxuXG4gIGZyZWUoKSB7XG4gICAgZm9yKCBsZXQgY2hpbGQgb2YgdGhpcy52b2ljZXMgKSBjaGlsZC5mcmVlKClcbiAgfVxufVxuIiwiLypcbiAqIFRoaXMgZmlsZXMgY3JlYXRlcyBhIGZhY3RvcnkgZ2VuZXJhdGluZyBwb2x5c3ludGggY29uc3RydWN0b3JzLlxuICovXG5cbmNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApXG5jb25zdCBfX3Byb3h5ID0gcmVxdWlyZSggJy4uL3dvcmtsZXRQcm94eS5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcblxuICBjb25zdCBUZW1wbGF0ZUZhY3RvcnkgPSAoIHVnZW4sIHByb3BlcnR5TGlzdCwgX2VudkNoZWNrICkgPT4ge1xuICAgIC8qIFxuICAgICAqIHBvbHlzeW50aHMgYXJlIGJhc2ljYWxseSBidXNzZXMgdGhhdCBjb25uZWN0IGNoaWxkIHN5bnRoIHZvaWNlcy5cbiAgICAgKiBXZSBjcmVhdGUgc2VwYXJhdGUgcHJvdG90eXBlcyBmb3IgbW9ubyB2cyBzdGVyZW8gaW5zdGFuY2VzLlxuICAgICAqL1xuXG4gICAgY29uc3QgbW9ub1Byb3RvICAgPSBPYmplY3QuY3JlYXRlKCBHaWJiZXJpc2guQnVzKCkgKSxcbiAgICAgICAgICBzdGVyZW9Qcm90byA9IE9iamVjdC5jcmVhdGUoIEdpYmJlcmlzaC5CdXMyKCkgKVxuXG4gICAgLy8gc2luY2UgdGhlcmUgYXJlIHR3byBwcm90b3R5cGVzIHdlIGNhbid0IGFzc2lnbiBkaXJlY3RseSB0byBvbmUgb2YgdGhlbS4uLlxuICAgIE9iamVjdC5hc3NpZ24oIG1vbm9Qcm90bywgICBHaWJiZXJpc2gubWl4aW5zLnBvbHlpbnN0cnVtZW50IClcbiAgICBPYmplY3QuYXNzaWduKCBzdGVyZW9Qcm90bywgR2liYmVyaXNoLm1peGlucy5wb2x5aW5zdHJ1bWVudCApXG5cbiAgICBjb25zdCBUZW1wbGF0ZSA9IHByb3BzID0+IHtcbiAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKCB7fSwgeyBpc1N0ZXJlbzp0cnVlLCBtYXhWb2ljZXM6NCB9LCBwcm9wcyApXG5cbiAgICAgIC8vY29uc3Qgc3ludGggPSBwcm9wZXJ0aWVzLmlzU3RlcmVvID09PSB0cnVlID8gT2JqZWN0LmNyZWF0ZSggc3RlcmVvUHJvdG8gKSA6IE9iamVjdC5jcmVhdGUoIG1vbm9Qcm90byApXG4gICAgICBjb25zdCBzeW50aCA9IHByb3BlcnRpZXMuaXNTdGVyZW8gPT09IHRydWUgPyBHaWJiZXJpc2guQnVzMih7IF9fdXNlUHJveHlfXzpmYWxzZSB9KSA6IEdpYmJlcmlzaC5CdXMoeyBfX3VzZVByb3h5X186ZmFsc2UgfSkgXG5cbiAgICAgIE9iamVjdC5hc3NpZ24oIFxuICAgICAgICBzeW50aCwgXG5cbiAgICAgICAge1xuICAgICAgICAgIHZvaWNlczogW10sXG4gICAgICAgICAgbWF4Vm9pY2VzOiBwcm9wZXJ0aWVzLm1heFZvaWNlcywgXG4gICAgICAgICAgdm9pY2VDb3VudDogMCxcbiAgICAgICAgICBlbnZDaGVjazogX2VudkNoZWNrLFxuICAgICAgICAgIGRpcnR5OiB0cnVlLFxuICAgICAgICAgIHVnZW5OYW1lOiAncG9seScgKyB1Z2VuLm5hbWUgKyAnXycgKyBzeW50aC5pZCArICdfJyArICggcHJvcGVydGllcy5pc1N0ZXJlbyA/IDIgOiAxICksXG4gICAgICAgICAgcHJvcGVydGllc1xuICAgICAgICB9LFxuXG4gICAgICAgIEdpYmJlcmlzaC5taXhpbnMucG9seWluc3RydW1lbnRcbiAgICAgIClcblxuICAgICAgcHJvcGVydGllcy5wYW5Wb2ljZXMgPSB0cnVlLy9mYWxzZS8vcHJvcGVydGllcy5pc1N0ZXJlb1xuICAgICAgc3ludGguY2FsbGJhY2sudWdlbk5hbWUgPSBzeW50aC51Z2VuTmFtZVxuXG4gICAgICBjb25zdCBzdG9yZWRJZCA9IHByb3BlcnRpZXMuaWRcbiAgICAgIGlmKCBwcm9wZXJ0aWVzLmlkICE9PSB1bmRlZmluZWQgKSBkZWxldGUgcHJvcGVydGllcy5pZCBcblxuICAgICAgZm9yKCBsZXQgaSA9IDA7IGkgPCBzeW50aC5tYXhWb2ljZXM7IGkrKyApIHtcbiAgICAgICAgcHJvcGVydGllcy5pZCA9IHN5bnRoLmlkICsnXycraVxuICAgICAgICBzeW50aC52b2ljZXNbaV0gPSB1Z2VuKCBwcm9wZXJ0aWVzIClcbiAgICAgICAgc3ludGgudm9pY2VzW2ldLmNhbGxiYWNrLnVnZW5OYW1lID0gc3ludGgudm9pY2VzW2ldLnVnZW5OYW1lXG4gICAgICAgIHN5bnRoLnZvaWNlc1tpXS5pc0Nvbm5lY3RlZCA9IGZhbHNlXG4gICAgICB9XG5cbiAgICAgIGxldCBfcHJvcGVydHlMaXN0IFxuICAgICAgaWYoIHByb3BlcnRpZXMuaXNTdGVyZW8gPT09IGZhbHNlICkge1xuICAgICAgICBfcHJvcGVydHlMaXN0ID0gcHJvcGVydHlMaXN0LnNsaWNlKCAwIClcbiAgICAgICAgY29uc3QgaWR4ID0gIF9wcm9wZXJ0eUxpc3QuaW5kZXhPZiggJ3BhbicgKVxuICAgICAgICBpZiggaWR4ICA+IC0xICkgX3Byb3BlcnR5TGlzdC5zcGxpY2UoIGlkeCwgMSApXG4gICAgICB9XG5cbiAgICAgIHByb3BlcnRpZXMuaWQgPSBzdG9yZWRJZFxuXG4gICAgICBUZW1wbGF0ZUZhY3Rvcnkuc2V0dXBQcm9wZXJ0aWVzKCBzeW50aCwgdWdlbiwgcHJvcGVydGllcy5pc1N0ZXJlbyA/IHByb3BlcnR5TGlzdCA6IF9wcm9wZXJ0eUxpc3QgKVxuXG4gICAgICByZXR1cm4gcHJveHkoIFsnaW5zdHJ1bWVudHMnLCAnUG9seScrdWdlbi5uYW1lXSwgcHJvcGVydGllcywgc3ludGggKSBcbiAgICB9XG5cbiAgICByZXR1cm4gVGVtcGxhdGVcbiAgfVxuXG4gIFRlbXBsYXRlRmFjdG9yeS5zZXR1cFByb3BlcnRpZXMgPSBmdW5jdGlvbiggc3ludGgsIHVnZW4sIHByb3BzICkge1xuICAgIGZvciggbGV0IHByb3BlcnR5IG9mIHByb3BzICkge1xuICAgICAgaWYoIHByb3BlcnR5ID09PSAncGFuJyB8fCBwcm9wZXJ0eSA9PT0gJ2lkJyApIGNvbnRpbnVlXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIHN5bnRoLCBwcm9wZXJ0eSwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHN5bnRoLnByb3BlcnRpZXNbIHByb3BlcnR5IF0gfHwgdWdlbi5kZWZhdWx0c1sgcHJvcGVydHkgXVxuICAgICAgICB9LFxuICAgICAgICBzZXQoIHYgKSB7XG4gICAgICAgICAgc3ludGgucHJvcGVydGllc1sgcHJvcGVydHkgXSA9IHZcbiAgICAgICAgICBmb3IoIGxldCBjaGlsZCBvZiBzeW50aC52b2ljZXMgKSB7XG4gICAgICAgICAgICBjaGlsZFsgcHJvcGVydHkgXSA9IHZcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFRlbXBsYXRlRmFjdG9yeVxuXG59XG4iLCJjb25zdCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICAgIGluc3RydW1lbnQgPSByZXF1aXJlKCAnLi9pbnN0cnVtZW50LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcbiAgbGV0IHByb3RvID0gT2JqZWN0LmNyZWF0ZSggaW5zdHJ1bWVudCApXG5cbiAgT2JqZWN0LmFzc2lnbiggcHJvdG8sIHtcbiAgICBub3RlKCByYXRlICkge1xuICAgICAgdGhpcy5yYXRlID0gcmF0ZVxuICAgICAgaWYoIHJhdGUgPiAwICkge1xuICAgICAgICB0aGlzLl9fdHJpZ2dlcigpXG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5fX3BoYXNlX18udmFsdWUgPSB0aGlzLmRhdGEuYnVmZmVyLmxlbmd0aCAtIDEgXG4gICAgICB9XG4gICAgfSxcbiAgICB0cmlnZ2VyKCB2b2x1bWUgKSB7XG4gICAgICBpZiggdm9sdW1lICE9PSB1bmRlZmluZWQgKSB0aGlzLmdhaW4gPSB2b2x1bWVcblxuICAgICAgLy8gaWYgd2UncmUgcGxheWluZyB0aGUgc2FtcGxlIGZvcndhcmRzLi4uXG4gICAgICBpZiggR2liYmVyaXNoLm1lbW9yeS5oZWFwWyB0aGlzLl9fcmF0ZVN0b3JhZ2VfXy5tZW1vcnkudmFsdWVzLmlkeCBdID4gMCApIHtcbiAgICAgICAgdGhpcy5fX3RyaWdnZXIoKVxuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuX19waGFzZV9fLnZhbHVlID0gdGhpcy5kYXRhLmJ1ZmZlci5sZW5ndGggLSAxIFxuICAgICAgfVxuICAgIH0sXG4gIH0pXG5cbiAgY29uc3QgU2FtcGxlciA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGNvbnN0IHN5biA9IE9iamVjdC5jcmVhdGUoIHByb3RvIClcblxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbiggeyBvbmxvYWQ6bnVsbCB9LCBTYW1wbGVyLmRlZmF1bHRzLCBpbnB1dFByb3BzIClcblxuICAgIHN5bi5pc1N0ZXJlbyA9IHByb3BzLmlzU3RlcmVvICE9PSB1bmRlZmluZWQgPyBwcm9wcy5pc1N0ZXJlbyA6IGZhbHNlXG5cbiAgICBjb25zdCBzdGFydCA9IGcuaW4oICdzdGFydCcgKSwgZW5kID0gZy5pbiggJ2VuZCcgKSwgXG4gICAgICAgICAgcmF0ZSA9IGcuaW4oICdyYXRlJyApLCBzaG91bGRMb29wID0gZy5pbiggJ2xvb3BzJyApLFxuICAgICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApLFxuICAgICAgICAgIC8vIHJhdGUgc3RvcmFnZSBpcyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHdlJ3JlIHBsYXlpbmdcbiAgICAgICAgICAvLyB0aGUgc2FtcGxlIGZvcndhcmQgb3IgaW4gcmV2ZXJzZSwgZm9yIHVzZSBpbiB0aGUgJ3RyaWdnZXInIG1ldGhvZC5cbiAgICAgICAgICByYXRlU3RvcmFnZSA9IGcuZGF0YShbMF0sIDEsIHsgbWV0YTp0cnVlIH0pXG5cbiAgICBPYmplY3QuYXNzaWduKCBzeW4sIHByb3BzIClcblxuICAgIGlmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3dvcmtsZXQnICkge1xuICAgICAgc3luLl9fbWV0YV9fID0ge1xuICAgICAgICBhZGRyZXNzOidhZGQnLFxuICAgICAgICBuYW1lOiBbJ2luc3RydW1lbnRzJywgJ1NhbXBsZXInXSxcbiAgICAgICAgcHJvcGVydGllczogSlNPTi5zdHJpbmdpZnkocHJvcHMpLCBcbiAgICAgICAgaWQ6IHN5bi5pZFxuICAgICAgfVxuXG4gICAgICBHaWJiZXJpc2gud29ya2xldC51Z2Vucy5zZXQoIHN5bi5pZCwgc3luIClcblxuICAgICAgR2liYmVyaXNoLndvcmtsZXQucG9ydC5wb3N0TWVzc2FnZSggc3luLl9fbWV0YV9fIClcbiAgICB9XG5cbiAgICBzeW4uX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgc3luLl9fYmFuZ19fID0gZy5iYW5nKClcbiAgICAgIHN5bi5fX3RyaWdnZXIgPSBzeW4uX19iYW5nX18udHJpZ2dlclxuXG4gICAgICBzeW4uX19waGFzZV9fID0gZy5jb3VudGVyKCByYXRlLCBzdGFydCwgZW5kLCBzeW4uX19iYW5nX18sIHNob3VsZExvb3AsIHsgc2hvdWxkV3JhcDpmYWxzZSwgaW5pdGlhbFZhbHVlOjk5OTk5OTkgfSlcbiAgICAgIFxuICAgICAgc3luLl9fcmF0ZVN0b3JhZ2VfXyA9IHJhdGVTdG9yYWdlXG4gICAgICByYXRlU3RvcmFnZVswXSA9IHJhdGVcblxuICAgICAgLy8gWFhYIHdlIGFkZGVkIG91ciByZWNvcmRlZCAncmF0ZScgcGFyYW0gYW5kIHRoZW4gZWZmZWN0aXZlbHkgc3Vic3RyYWN0IGl0LFxuICAgICAgLy8gc28gdGhhdCBpdHMgcHJlc2VuY2UgaW4gdGhlIGdyYXBoIHdpbGwgZm9yY2UgZ2VuaXNoIHRvIGFjdHVhbGx5IHJlY29yZCB0aGUgXG4gICAgICAvLyByYXRlIGFzIHRoZSBpbnB1dC4gdGhpcyBpcyBleHRyZW1lbHkgaGFja3kuLi4gdGhlcmUgc2hvdWxkIGJlIGEgd2F5IHRvIHJlY29yZFxuICAgICAgLy8gdmFsdWUgd2l0aG91dCBoYXZpbmcgdG8gaW5jbHVkZSBpdCBpbiB0aGUgZ3JhcGghXG4gICAgICBzeW4uZ3JhcGggPSBnLmFkZCggZy5tdWwoIFxuICAgICAgICBnLmlmZWxzZSggXG4gICAgICAgICAgZy5hbmQoIGcuZ3RlKCBzeW4uX19waGFzZV9fLCBzdGFydCApLCBnLmx0KCBzeW4uX19waGFzZV9fLCBlbmQgKSApLFxuICAgICAgICAgIGcucGVlayggXG4gICAgICAgICAgICBzeW4uZGF0YSwgXG4gICAgICAgICAgICBzeW4uX19waGFzZV9fLFxuICAgICAgICAgICAgeyBtb2RlOidzYW1wbGVzJyB9XG4gICAgICAgICAgKSxcbiAgICAgICAgICAwXG4gICAgICAgICksIFxuICAgICAgICBnLm11bCggbG91ZG5lc3MsIGcuaW4oJ2dhaW4nKSApXG4gICAgICApLCByYXRlU3RvcmFnZVswXSwgZy5tdWwoIHJhdGVTdG9yYWdlWzBdLCAtMSApIClcbiAgICB9XG5cbiAgICBjb25zdCBvbmxvYWQgPSBidWZmZXIgPT4ge1xuICAgICAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgICAgIGNvbnN0IG1lbUlkeCA9IEdpYmJlcmlzaC5tZW1vcnkuYWxsb2MoIHN5bi5kYXRhLm1lbW9yeS52YWx1ZXMubGVuZ3RoLCB0cnVlIClcblxuICAgICAgICBHaWJiZXJpc2gud29ya2xldC5wb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICBhZGRyZXNzOidjb3B5JyxcbiAgICAgICAgICBpZDogc3luLmlkLFxuICAgICAgICAgIGlkeDogbWVtSWR4LFxuICAgICAgICAgIGJ1ZmZlcjogc3luLmRhdGEuYnVmZmVyXG4gICAgICAgIH0pXG5cbiAgICAgIH1lbHNlIGlmICggR2liYmVyaXNoLm1vZGUgPT09ICdwcm9jZXNzb3InICkge1xuICAgICAgICBzeW4uZGF0YS5idWZmZXIgPSBidWZmZXJcbiAgICAgICAgc3luLmRhdGEubWVtb3J5LnZhbHVlcy5sZW5ndGggPSBzeW4uZGF0YS5kaW0gPSBidWZmZXIubGVuZ3RoXG4gICAgICAgIHN5bi5fX3JlZG9HcmFwaCgpIFxuICAgICAgfVxuXG4gICAgICBpZiggdHlwZW9mIHN5bi5vbmxvYWQgPT09ICdmdW5jdGlvbicgKXsgIFxuICAgICAgICBzeW4ub25sb2FkKCBidWZmZXIgfHwgc3luLmRhdGEuYnVmZmVyIClcbiAgICAgIH1cbiAgICAgIGlmKCBzeW4uZW5kID09PSAtOTk5OTk5OTk5ICkgc3luLmVuZCA9IHN5bi5kYXRhLmJ1ZmZlci5sZW5ndGggLSAxXG4gICAgfVxuXG4gICAgLy9pZiggcHJvcHMuZmlsZW5hbWUgKSB7XG4gICAgc3luLmxvYWRGaWxlID0gZnVuY3Rpb24oIGZpbGVuYW1lICkge1xuICAgICAgaWYoIEdpYmJlcmlzaC5tb2RlICE9PSAncHJvY2Vzc29yJyApIHsgXG4gICAgICAgIHN5bi5kYXRhID0gZy5kYXRhKCBmaWxlbmFtZSApXG4gICAgICB9ZWxzZXtcbiAgICAgICAgc3luLmRhdGEgPSBnLmRhdGEoIG5ldyBGbG9hdDMyQXJyYXkoKSApXG4gICAgICB9XG5cbiAgICAgIHN5bi5kYXRhLm9ubG9hZCA9IG9ubG9hZFxuICAgIH1cblxuICAgIHN5bi5sb2FkQnVmZmVyID0gZnVuY3Rpb24oIGJ1ZmZlciApIHtcbiAgICAgIGlmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3Byb2Nlc3NvcicgKSB7XG4gICAgICAgIHN5bi5kYXRhLmJ1ZmZlciA9IGJ1ZmZlclxuICAgICAgICBzeW4uZGF0YS5tZW1vcnkudmFsdWVzLmxlbmd0aCA9IHN5bi5kYXRhLmRpbSA9IGJ1ZmZlci5sZW5ndGhcbiAgICAgICAgc3luLl9fcmVkb0dyYXBoKCkgXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoIHByb3BzLmZpbGVuYW1lICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICBzeW4ubG9hZEZpbGUoIHByb3BzLmZpbGVuYW1lIClcbiAgICB9ZWxzZXtcbiAgICAgIHN5bi5kYXRhID0gZy5kYXRhKCBuZXcgRmxvYXQzMkFycmF5KCkgKVxuICAgIH1cblxuICAgIHN5bi5kYXRhLm9ubG9hZCA9IG9ubG9hZFxuXG4gICAgc3luLl9fY3JlYXRlR3JhcGgoKVxuICAgIFxuICAgIGNvbnN0IG91dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCBcbiAgICAgIHN5bixcbiAgICAgIHN5bi5ncmFwaCxcbiAgICAgIFsnaW5zdHJ1bWVudHMnLCdzYW1wbGVyJ10sIFxuICAgICAgcHJvcHMgXG4gICAgKSBcblxuICAgIHJldHVybiBvdXRcbiAgfVxuXG4gIFNhbXBsZXIuZGVmYXVsdHMgPSB7XG4gICAgZ2FpbjogMSxcbiAgICBwYW46IC41LFxuICAgIHJhdGU6IDEsXG4gICAgcGFuVm9pY2VzOmZhbHNlLFxuICAgIGxvb3BzOiAwLFxuICAgIHN0YXJ0OjAsXG4gICAgZW5kOi05OTk5OTk5OTksXG4gICAgbG91ZG5lc3M6MVxuICB9XG5cbiAgY29uc3QgZW52Q2hlY2tGYWN0b3J5ID0gZnVuY3Rpb24oIHZvaWNlLCBfcG9seSApIHtcblxuICAgIGNvbnN0IGVudkNoZWNrID0gKCkgPT4ge1xuICAgICAgY29uc3QgcGhhc2UgPSBHaWJiZXJpc2gubWVtb3J5LmhlYXBbIHZvaWNlLl9fcGhhc2VfXy5tZW1vcnkudmFsdWUuaWR4IF1cbiAgICAgIGlmKCAoIHZvaWNlLnJhdGUgPiAwICYmIHBoYXNlID4gdm9pY2UuZW5kICkgfHwgKCB2b2ljZS5yYXRlIDwgMCAmJiBwaGFzZSA8IDAgKSApIHtcbiAgICAgICAgX3BvbHkuZGlzY29ubmVjdFVnZW4uY2FsbCggX3BvbHksIHZvaWNlIClcbiAgICAgICAgdm9pY2UuaXNDb25uZWN0ZWQgPSBmYWxzZVxuICAgICAgfWVsc2V7XG4gICAgICAgIEdpYmJlcmlzaC5ibG9ja0NhbGxiYWNrcy5wdXNoKCBlbnZDaGVjayApXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudkNoZWNrXG4gIH1cblxuICBjb25zdCBQb2x5U2FtcGxlciA9IEdpYmJlcmlzaC5Qb2x5VGVtcGxhdGUoIFNhbXBsZXIsIFsncmF0ZScsJ3BhbicsJ2dhaW4nLCdzdGFydCcsJ2VuZCcsJ2xvb3BzJ10sIGVudkNoZWNrRmFjdG9yeSApIFxuXG4gIHJldHVybiBbIFNhbXBsZXIsIFBvbHlTYW1wbGVyIF1cbn1cblxuIiwibGV0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgIGluc3RydW1lbnQgPSByZXF1aXJlKCAnLi9pbnN0cnVtZW50LmpzJyApXG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGxldCBTbmFyZSA9IGFyZ3VtZW50UHJvcHMgPT4ge1xuICAgIGxldCBzbmFyZSA9IE9iamVjdC5jcmVhdGUoIGluc3RydW1lbnQgKSxcbiAgICAgICAgZGVjYXkgPSBnLmluKCAnZGVjYXknICksXG4gICAgICAgIHNjYWxlZERlY2F5ID0gZy5tdWwoIGRlY2F5LCBnLmdlbi5zYW1wbGVyYXRlICogMiApLFxuICAgICAgICBzbmFwcHk9IGcuaW4oICdzbmFwcHknICksXG4gICAgICAgIHR1bmUgID0gZy5pbiggJ3R1bmUnICksXG4gICAgICAgIGdhaW4gID0gZy5pbiggJ2dhaW4nICksXG4gICAgICAgIGxvdWRuZXNzID0gZy5pbiggJ2xvdWRuZXNzJyApXG5cbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgU25hcmUuZGVmYXVsdHMsIGFyZ3VtZW50UHJvcHMgKVxuXG4gICAgbGV0IGVnID0gZy5kZWNheSggc2NhbGVkRGVjYXksIHsgaW5pdFZhbHVlOjAgfSApLCBcbiAgICAgICAgY2hlY2sgPSBnLm1lbW8oIGcuZ3QoIGVnLCAuMDAwNSApICksXG4gICAgICAgIHJuZCA9IGcubXVsKCBnLm5vaXNlKCksIGVnICksXG4gICAgICAgIGhwZiA9IGcuc3ZmKCBybmQsIGcuYWRkKCAxMDAwLCBnLm11bCggZy5hZGQoIDEsIHR1bmUpLCAxMDAwICkgKSwgLjUsIDEsIGZhbHNlICksXG4gICAgICAgIHNuYXAgPSBnLm11bCggZy5ndHAoIGcubXVsKCBocGYsIHNuYXBweSApLCAwICksIGxvdWRuZXNzICksIC8vIHJlY3RpZnlcbiAgICAgICAgYnBmMSA9IGcuc3ZmKCBlZywgZy5tdWwoIDE4MCwgZy5hZGQoIHR1bmUsIDEgKSApLCAuMDUsIDIsIGZhbHNlICksXG4gICAgICAgIGJwZjIgPSBnLnN2ZiggZWcsIGcubXVsKCAzMzAsIGcuYWRkKCB0dW5lLCAxICkgKSwgLjA1LCAyLCBmYWxzZSApLFxuICAgICAgICBvdXQgID0gZy5tZW1vKCBnLmFkZCggc25hcCwgYnBmMSwgZy5tdWwoIGJwZjIsIC44ICkgKSApLCAvL1hYWCB3aHkgaXMgbWVtbyBuZWVkZWQ/XG4gICAgICAgIHNjYWxlZE91dCA9IGcubXVsKCBvdXQsIGcubXVsKCBnYWluLCBsb3VkbmVzcyApIClcbiAgICBcbiAgICAvLyBYWFggVE9ETyA6IG1ha2UgdGhpcyB3b3JrIHdpdGggaWZlbHNlLiB0aGUgcHJvYmxlbSBpcyB0aGF0IHBva2UgdWdlbnMgcHV0IHRoZWlyXG4gICAgLy8gY29kZSBhdCB0aGUgYm90dG9tIG9mIHRoZSBjYWxsYmFjayBmdW5jdGlvbiwgaW5zdGVhZCBvZiBhdCB0aGUgZW5kIG9mIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgaWYvZWxzZSBibG9jay5cbiAgICBsZXQgaWZlID0gZy5zd2l0Y2goIGNoZWNrLCBzY2FsZWRPdXQsIDAgKVxuICAgIC8vbGV0IGlmZSA9IGcuaWZlbHNlKCBnLmd0KCBlZywgLjAwNSApLCBjeWNsZSg0NDApLCAwIClcbiAgICBcbiAgICBzbmFyZS5lbnYgPSBlZyBcbiAgICBzbmFyZSA9IEdpYmJlcmlzaC5mYWN0b3J5KCBzbmFyZSwgaWZlLCBbJ2luc3RydW1lbnRzJywnc25hcmUnXSwgcHJvcHMgIClcbiAgICBcbiAgICByZXR1cm4gc25hcmVcbiAgfVxuICBcbiAgU25hcmUuZGVmYXVsdHMgPSB7XG4gICAgZ2FpbjogLjUsXG4gICAgZnJlcXVlbmN5OjEwMDAsXG4gICAgdHVuZTowLFxuICAgIHNuYXBweTogMSxcbiAgICBkZWNheTouMSxcbiAgICBsb3VkbmVzczoxXG4gIH1cblxuICByZXR1cm4gU25hcmVcblxufVxuIiwiY29uc3QgZyA9IHJlcXVpcmUoJ2dlbmlzaC5qcycpLFxuICAgICAgaW5zdHJ1bWVudCA9IHJlcXVpcmUoJy4vaW5zdHJ1bWVudC5qcycpO1xuXG5jb25zdCBnZW5pc2ggPSBnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChHaWJiZXJpc2gpIHtcblxuICBjb25zdCBTeW50aCA9IGlucHV0UHJvcHMgPT4ge1xuICAgIGNvbnN0IHN5biA9IE9iamVjdC5jcmVhdGUoaW5zdHJ1bWVudCk7XG5cbiAgICBjb25zdCBmcmVxdWVuY3kgPSBnLmluKCdmcmVxdWVuY3knKSxcbiAgICAgICAgICBsb3VkbmVzcyA9IGcuaW4oJ2xvdWRuZXNzJyksXG4gICAgICAgICAgZ2xpZGUgPSBnLmluKCdnbGlkZScpLFxuICAgICAgICAgIHNsaWRpbmdGcmVxID0gZy5zbGlkZShmcmVxdWVuY3ksIGdsaWRlLCBnbGlkZSksXG4gICAgICAgICAgYXR0YWNrID0gZy5pbignYXR0YWNrJyksXG4gICAgICAgICAgZGVjYXkgPSBnLmluKCdkZWNheScpLFxuICAgICAgICAgIHN1c3RhaW4gPSBnLmluKCdzdXN0YWluJyksXG4gICAgICAgICAgc3VzdGFpbkxldmVsID0gZy5pbignc3VzdGFpbkxldmVsJyksXG4gICAgICAgICAgcmVsZWFzZSA9IGcuaW4oJ3JlbGVhc2UnKTtcblxuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgU3ludGguZGVmYXVsdHMsIGlucHV0UHJvcHMpO1xuICAgIE9iamVjdC5hc3NpZ24oc3luLCBwcm9wcyk7XG5cbiAgICBzeW4uX19jcmVhdGVHcmFwaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG9zYyA9IEdpYmJlcmlzaC5vc2NpbGxhdG9ycy5mYWN0b3J5KHN5bi53YXZlZm9ybSwgc2xpZGluZ0ZyZXEsIHN5bi5hbnRpYWxpYXMpO1xuXG4gICAgICBjb25zdCBlbnYgPSBHaWJiZXJpc2guZW52ZWxvcGVzLmZhY3RvcnkocHJvcHMudXNlQURTUiwgcHJvcHMuc2hhcGUsIGF0dGFjaywgZGVjYXksIHN1c3RhaW4sIHN1c3RhaW5MZXZlbCwgcmVsZWFzZSwgcHJvcHMudHJpZ2dlclJlbGVhc2UpO1xuXG4gICAgICAvLyBiZWxvdyBkb2Vzbid0IHdvcmsgYXMgaXQgYXR0ZW1wdHMgdG8gYXNzaWduIHRvIHJlbGVhc2UgcHJvcGVydHkgdHJpZ2dlcmluZyBjb2RlZ2VuLi4uXG4gICAgICAvLyBzeW4ucmVsZWFzZSA9ICgpPT4geyBzeW4uZW52LnJlbGVhc2UoKSB9XG5cbiAgICAgIHtcbiAgICAgICAgJ3VzZSBqc2RzcCc7XG4gICAgICAgIGxldCBvc2NXaXRoRW52ID0gZ2VuaXNoLm11bChnZW5pc2gubXVsKG9zYywgZW52KSwgbG91ZG5lc3MpLFxuICAgICAgICAgICAgcGFubmVyO1xuXG4gICAgICAgIGNvbnN0IGJhc2VDdXRvZmZGcmVxID0gZ2VuaXNoLm11bChnLmluKCdjdXRvZmYnKSwgZnJlcXVlbmN5KTtcbiAgICAgICAgY29uc3QgY3V0b2ZmID0gZ2VuaXNoLm11bChnZW5pc2gubXVsKGJhc2VDdXRvZmZGcmVxLCBnLnBvdygyLCBnZW5pc2gubXVsKGcuaW4oJ2ZpbHRlck11bHQnKSwgbG91ZG5lc3MpKSksIGVudik7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkT3NjID0gR2liYmVyaXNoLmZpbHRlcnMuZmFjdG9yeShvc2NXaXRoRW52LCBjdXRvZmYsIGcuaW4oJ1EnKSwgZy5pbignc2F0dXJhdGlvbicpLCBwcm9wcyk7XG5cbiAgICAgICAgbGV0IHN5bnRoV2l0aEdhaW4gPSBnZW5pc2gubXVsKGZpbHRlcmVkT3NjLCBnLmluKCdnYWluJykpO1xuXG4gICAgICAgIGlmIChzeW4ucGFuVm9pY2VzID09PSB0cnVlKSB7XG4gICAgICAgICAgcGFubmVyID0gZy5wYW4oc3ludGhXaXRoR2Fpbiwgc3ludGhXaXRoR2FpbiwgZy5pbigncGFuJykpO1xuICAgICAgICAgIHN5bi5ncmFwaCA9IFtwYW5uZXIubGVmdCwgcGFubmVyLnJpZ2h0XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzeW4uZ3JhcGggPSBzeW50aFdpdGhHYWluO1xuICAgICAgICB9XG5cbiAgICAgICAgc3luLmVudiA9IGVudjtcbiAgICAgICAgc3luLm9zYyA9IG9zYztcbiAgICAgICAgc3luLmZpbHRlciA9IGZpbHRlcmVkT3NjO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzeW4uX19yZXF1aXJlc1JlY29tcGlsYXRpb24gPSBbJ3dhdmVmb3JtJywgJ2FudGlhbGlhcycsICdmaWx0ZXJUeXBlJywgJ2ZpbHRlck1vZGUnLCAndXNlQURTUicsICdzaGFwZSddO1xuICAgIHN5bi5fX2NyZWF0ZUdyYXBoKCk7XG5cbiAgICBjb25zdCBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeShzeW4sIHN5bi5ncmFwaCwgWydpbnN0cnVtZW50cycsICdzeW50aCddLCBwcm9wcyk7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIFN5bnRoLmRlZmF1bHRzID0ge1xuICAgIHdhdmVmb3JtOiAnc2F3JyxcbiAgICBhdHRhY2s6IDQ0LFxuICAgIGRlY2F5OiAyMjA1MCxcbiAgICBzdXN0YWluOiA0NDEwMCxcbiAgICBzdXN0YWluTGV2ZWw6IC42LFxuICAgIHJlbGVhc2U6IDIyMDUwLFxuICAgIHVzZUFEU1I6IGZhbHNlLFxuICAgIHNoYXBlOiAnbGluZWFyJyxcbiAgICB0cmlnZ2VyUmVsZWFzZTogZmFsc2UsXG4gICAgZ2FpbjogLjUsXG4gICAgcHVsc2V3aWR0aDogLjI1LFxuICAgIGZyZXF1ZW5jeTogMjIwLFxuICAgIHBhbjogLjUsXG4gICAgYW50aWFsaWFzOiBmYWxzZSxcbiAgICBwYW5Wb2ljZXM6IGZhbHNlLFxuICAgIGxvdWRuZXNzOiAxLFxuICAgIGdsaWRlOiAxLFxuICAgIHNhdHVyYXRpb246IDEsXG4gICAgZmlsdGVyTXVsdDogMixcbiAgICBROiAuMjUsXG4gICAgY3V0b2ZmOiAuNSxcbiAgICBmaWx0ZXJUeXBlOiAwLFxuICAgIGZpbHRlck1vZGU6IDAsXG4gICAgaXNMb3dQYXNzOiAxXG4gIH07XG5cbiAgLy8gZG8gbm90IGluY2x1ZGUgdmVsb2NpdHksIHdoaWNoIHNob3VkbCBhbHdheXMgYmUgcGVyIHZvaWNlXG4gIGxldCBQb2x5U3ludGggPSBHaWJiZXJpc2guUG9seVRlbXBsYXRlKFN5bnRoLCBbJ2ZyZXF1ZW5jeScsICdhdHRhY2snLCAnZGVjYXknLCAncHVsc2V3aWR0aCcsICdwYW4nLCAnZ2FpbicsICdnbGlkZScsICdzYXR1cmF0aW9uJywgJ2ZpbHRlck11bHQnLCAnUScsICdjdXRvZmYnLCAncmVzb25hbmNlJywgJ2FudGlhbGlhcycsICdmaWx0ZXJUeXBlJywgJ3dhdmVmb3JtJywgJ2ZpbHRlck1vZGUnXSk7XG4gIFBvbHlTeW50aC5kZWZhdWx0cyA9IFN5bnRoLmRlZmF1bHRzO1xuXG4gIHJldHVybiBbU3ludGgsIFBvbHlTeW50aF07XG59OyIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgaW5zdHJ1bWVudCA9IHJlcXVpcmUoICcuL2luc3RydW1lbnQuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IFRvbSA9IGFyZ3VtZW50UHJvcHMgPT4ge1xuICAgIGxldCB0b20gPSBPYmplY3QuY3JlYXRlKCBpbnN0cnVtZW50IClcbiAgICBcbiAgICBjb25zdCBkZWNheSAgID0gZy5pbiggJ2RlY2F5JyApLFxuICAgICAgICAgIHBpdGNoICAgPSBnLmluKCAnZnJlcXVlbmN5JyApLFxuICAgICAgICAgIGdhaW4gICAgPSBnLmluKCAnZ2FpbicgKSxcbiAgICAgICAgICBsb3VkbmVzcyA9IGcuaW4oICdsb3VkbmVzcycgKVxuXG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKCB7fSwgVG9tLmRlZmF1bHRzLCBhcmd1bWVudFByb3BzIClcblxuICAgIGNvbnN0IHRyaWdnZXIgPSBnLmJhbmcoKSxcbiAgICAgICAgICBpbXB1bHNlID0gZy5tdWwoIHRyaWdnZXIsIDEgKSxcbiAgICAgICAgICBlZyA9IGcuZGVjYXkoIGcubXVsKCBkZWNheSwgZy5nZW4uc2FtcGxlcmF0ZSAqIDIgKSwgeyBpbml0VmFsdWU6MCB9ICksIFxuICAgICAgICAgIGJwZiA9IGcubXVsKCBnLnN2ZiggaW1wdWxzZSwgcGl0Y2gsIC4wMTc1LCAyLCBmYWxzZSApLCAxMCApLFxuICAgICAgICAgIG5vaXNlID0gZy5ndHAoIGcubm9pc2UoKSwgMCApLCAvLyByZWN0aWZ5IG5vaXNlXG4gICAgICAgICAgZW52ZWxvcGVkTm9pc2UgPSBnLm11bCggbm9pc2UsIGVnICksXG4gICAgICAgICAgbHBmID0gZy5tdWwoIGcuc3ZmKCBlbnZlbG9wZWROb2lzZSwgMTIwLCAuNSwgMCwgZmFsc2UgKSwgMi41ICksXG4gICAgICAgICAgb3V0ID0gZy5tdWwoIGcuYWRkKCBicGYsIGxwZiApLCBnLm11bCggZ2FpbiwgbG91ZG5lc3MgKSApXG5cbiAgICB0b20uZW52ID0ge1xuICAgICAgdHJpZ2dlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGVnLnRyaWdnZXIoKVxuICAgICAgICB0cmlnZ2VyLnRyaWdnZXIoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRvbS5pc1N0ZXJlbyA9IGZhbHNlXG5cbiAgICB0b20gPSBHaWJiZXJpc2guZmFjdG9yeSggdG9tLCBvdXQsIFsnaW5zdHJ1bWVudHMnLCAndG9tJ10sIHByb3BzICApXG4gICAgXG4gICAgcmV0dXJuIHRvbVxuICB9XG4gIFxuICBUb20uZGVmYXVsdHMgPSB7XG4gICAgZ2FpbjogMSxcbiAgICBkZWNheTouNyxcbiAgICBmcmVxdWVuY3k6MTIwLFxuICAgIGxvdWRuZXNzOjFcbiAgfVxuXG4gIHJldHVybiBUb21cbn1cbiIsImNvbnN0IHVnZW5wcm90byA9IHJlcXVpcmUoICcuLi91Z2VuLmpzJyApKClcbmNvbnN0IF9fcHJveHkgICAgID0gcmVxdWlyZSggJy4uL3dvcmtsZXRQcm94eS5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcblxuICBsZXQgQmlub3BzID0ge1xuICAgIGV4cG9ydCggb2JqICkge1xuICAgICAgZm9yKCBsZXQga2V5IGluIEJpbm9wcyApIHtcbiAgICAgICAgaWYoIGtleSAhPT0gJ2V4cG9ydCcgKSB7XG4gICAgICAgICAgb2JqWyBrZXkgXSA9IEJpbm9wc1sga2V5IF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgQWRkKCAuLi5hcmdzICkge1xuICAgICAgY29uc3QgaWQgPSBHaWJiZXJpc2guZmFjdG9yeS5nZXRVSUQoKVxuICAgICAgY29uc3QgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHVnZW5wcm90byApXG4gICAgICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IGlzb3A6dHJ1ZSwgb3A6JysnLCBpbnB1dHM6YXJncywgdWdlbk5hbWU6J2FkZCcgKyBpZCwgaWQgfSApXG5cbiAgICAgIHJldHVybiBwcm94eSggWydiaW5vcHMnLCdBZGQnXSwgeyBpc29wOnRydWUsIGlucHV0czphcmdzIH0sIHVnZW4gKVxuICAgIH0sXG5cbiAgICBTdWIoIC4uLmFyZ3MgKSB7XG4gICAgICBjb25zdCBpZCA9IEdpYmJlcmlzaC5mYWN0b3J5LmdldFVJRCgpXG4gICAgICBjb25zdCB1Z2VuID0gT2JqZWN0LmNyZWF0ZSggdWdlbnByb3RvIClcbiAgICAgIE9iamVjdC5hc3NpZ24oIHVnZW4sIHsgaXNvcDp0cnVlLCBvcDonLScsIGlucHV0czphcmdzLCB1Z2VuTmFtZTonc3ViJyArIGlkLCBpZCB9IClcblxuICAgICAgcmV0dXJuIHByb3h5KCBbJ2Jpbm9wcycsJ1N1YiddLCB7IGlzb3A6dHJ1ZSwgaW5wdXRzOmFyZ3MgfSwgdWdlbiApXG4gICAgfSxcblxuICAgIE11bCggLi4uYXJncyApIHtcbiAgICAgIGNvbnN0IGlkID0gR2liYmVyaXNoLmZhY3RvcnkuZ2V0VUlEKClcbiAgICAgIGNvbnN0IHVnZW4gPSBPYmplY3QuY3JlYXRlKCB1Z2VucHJvdG8gKVxuICAgICAgT2JqZWN0LmFzc2lnbiggdWdlbiwgeyBpc29wOnRydWUsIG9wOicqJywgaW5wdXRzOmFyZ3MsIHVnZW5OYW1lOidtdWwnICsgaWQsIGlkIH0gKVxuXG4gICAgICByZXR1cm4gcHJveHkoIFsnYmlub3BzJywnTXVsJ10sIHsgaXNvcDp0cnVlLCBpbnB1dHM6YXJncyB9LCB1Z2VuIClcbiAgICB9LFxuXG4gICAgRGl2KCAuLi5hcmdzICkge1xuICAgICAgY29uc3QgaWQgPSBHaWJiZXJpc2guZmFjdG9yeS5nZXRVSUQoKVxuICAgICAgY29uc3QgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHVnZW5wcm90byApXG4gICAgICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IGlzb3A6dHJ1ZSwgb3A6Jy8nLCBpbnB1dHM6YXJncywgdWdlbk5hbWU6J2RpdicgKyBpZCwgaWQgfSApXG4gICAgXG4gICAgICByZXR1cm4gcHJveHkoIFsnYmlub3BzJywnRGl2J10sIHsgaXNvcDp0cnVlLCBpbnB1dHM6YXJncyB9LCB1Z2VuIClcbiAgICB9LFxuXG4gICAgTW9kKCAuLi5hcmdzICkge1xuICAgICAgY29uc3QgaWQgPSBHaWJiZXJpc2guZmFjdG9yeS5nZXRVSUQoKVxuICAgICAgY29uc3QgdWdlbiA9IE9iamVjdC5jcmVhdGUoIHVnZW5wcm90byApXG4gICAgICBPYmplY3QuYXNzaWduKCB1Z2VuLCB7IGlzb3A6dHJ1ZSwgb3A6JyUnLCBpbnB1dHM6YXJncywgdWdlbk5hbWU6J21vZCcgKyBpZCwgaWQgfSApXG5cbiAgICAgIHJldHVybiBwcm94eSggWydiaW5vcHMnLCdNb2QnXSwgeyBpc29wOnRydWUsIGlucHV0czphcmdzIH0sIHVnZW4gKVxuICAgIH0sICAgXG4gIH1cblxuICByZXR1cm4gQmlub3BzXG59XG4iLCJsZXQgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnICksXG4gICAgdWdlbiA9IHJlcXVpcmUoICcuLi91Z2VuLmpzJyApKCksXG4gICAgX19wcm94eT0gcmVxdWlyZSggJy4uL3dvcmtsZXRQcm94eS5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcbiAgY29uc3QgQnVzID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG5cbiAgT2JqZWN0LmFzc2lnbiggQnVzLCB7XG4gICAgZ2Fpbjoge1xuICAgICAgc2V0KCB2ICkge1xuICAgICAgICB0aGlzLm11bC5pbnB1dHNbIDEgXSA9IHZcbiAgICAgICAgR2liYmVyaXNoLmRpcnR5KCB0aGlzIClcbiAgICAgIH0sXG4gICAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm11bFsgMSBdXG4gICAgICB9XG4gICAgfSxcblxuICAgIF9fYWRkSW5wdXQoIGlucHV0ICkge1xuICAgICAgdGhpcy5zdW0uaW5wdXRzLnB1c2goIGlucHV0IClcbiAgICAgIEdpYmJlcmlzaC5kaXJ0eSggdGhpcyApXG4gICAgfSxcblxuICAgIGNyZWF0ZSggX3Byb3BzICkge1xuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBCdXMuZGVmYXVsdHMsIHsgaW5wdXRzOlswXSB9LCBfcHJvcHMgKVxuXG4gICAgICBjb25zdCBzdW0gPSBHaWJiZXJpc2guYmlub3BzLkFkZCggLi4ucHJvcHMuaW5wdXRzIClcbiAgICAgIGNvbnN0IG11bCA9IEdpYmJlcmlzaC5iaW5vcHMuTXVsKCBzdW0sIHByb3BzLmdhaW4gKVxuXG4gICAgICBjb25zdCBncmFwaCA9IEdpYmJlcmlzaC5QYW5uZXIoeyBpbnB1dDptdWwsIHBhbjogcHJvcHMucGFuIH0pXG5cbiAgICAgIGdyYXBoLnN1bSA9IHN1bVxuICAgICAgZ3JhcGgubXVsID0gbXVsXG4gICAgICBncmFwaC5kaXNjb25uZWN0VWdlbiA9IEJ1cy5kaXNjb25uZWN0VWdlblxuXG4gICAgICBncmFwaC5fX3Byb3BlcnRpZXNfXyA9IHByb3BzXG5cbiAgICAgIGNvbnN0IG91dCA9IHByb3BzLl9fdXNlUHJveHlfXyA9PT0gdHJ1ZSA/IHByb3h5KCBbJ0J1cyddLCBwcm9wcywgZ3JhcGggKSA6IGdyYXBoXG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggb3V0LCAnZ2FpbicsIEJ1cy5nYWluIClcblxuICAgICAgaWYoIGZhbHNlICYmIEdpYmJlcmlzaC5wcmV2ZW50UHJveHkgPT09IGZhbHNlICYmIEdpYmJlcmlzaC5tb2RlID09PSAnd29ya2xldCcgKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSB7XG4gICAgICAgICAgYWRkcmVzczonYWRkJyxcbiAgICAgICAgICBuYW1lOlsnQnVzJ10sXG4gICAgICAgICAgcHJvcHMsIFxuICAgICAgICAgIGlkOmdyYXBoLmlkXG4gICAgICAgIH1cbiAgICAgICAgR2liYmVyaXNoLndvcmtsZXQucG9ydC5wb3N0TWVzc2FnZSggbWV0YSApXG4gICAgICAgIEdpYmJlcmlzaC53b3JrbGV0LnBvcnQucG9zdE1lc3NhZ2UoeyBcbiAgICAgICAgICBhZGRyZXNzOidtZXRob2QnLCBcbiAgICAgICAgICBvYmplY3Q6Z3JhcGguaWQsXG4gICAgICAgICAgbmFtZTonY29ubmVjdCcsXG4gICAgICAgICAgYXJnczpbXVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3V0IFxuICAgIH0sXG5cbiAgICBkaXNjb25uZWN0VWdlbiggdWdlbiApIHtcbiAgICAgIGxldCByZW1vdmVJZHggPSB0aGlzLnN1bS5pbnB1dHMuaW5kZXhPZiggdWdlbiApXG5cbiAgICAgIGlmKCByZW1vdmVJZHggIT09IC0xICkge1xuICAgICAgICB0aGlzLnN1bS5pbnB1dHMuc3BsaWNlKCByZW1vdmVJZHgsIDEgKVxuICAgICAgICBHaWJiZXJpc2guZGlydHkoIHRoaXMgKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBjYW4ndCBpbmNsdWRlIGlucHV0cyBoZXJlIGFzIGl0IHdpbGwgYmUgc3Vja2VkIHVwIGJ5IEdpYmJlcixcbiAgICAvLyBpbnN0ZWFkIHBhc3MgZHVyaW5nIE9iamVjdC5hc3NpZ24oKSBhZnRlciBkZWZhdWx0cy5cbiAgICBkZWZhdWx0czogeyBnYWluOjEsIHBhbjouNSwgX191c2VQcm94eV9fOnRydWUgfVxuICB9KVxuXG4gIGNvbnN0IGNvbnN0cnVjdG9yID0gQnVzLmNyZWF0ZS5iaW5kKCBCdXMgKVxuICBjb25zdHJ1Y3Rvci5kZWZhdWx0cyA9IEJ1cy5kZWZhdWx0c1xuXG4gIHJldHVybiBjb25zdHJ1Y3RvclxufVxuXG4iLCJjb25zdCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICAgIHVnZW4gPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKSgpLFxuICAgICAgX19wcm94eSA9IHJlcXVpcmUoICcuLi93b3JrbGV0UHJveHkuanMnIClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuICBjb25zdCBCdXMyID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcblxuICBsZXQgYnVmZmVyTCwgYnVmZmVyUlxuICBcbiAgT2JqZWN0LmFzc2lnbiggQnVzMiwgeyBcbiAgICBjcmVhdGUoIF9fcHJvcHMgKSB7XG5cbiAgICAgIGlmKCBidWZmZXJMID09PSB1bmRlZmluZWQgKSB7XG4gICAgICAgIGJ1ZmZlckwgPSBHaWJiZXJpc2guZ2VuaXNoLmdlbi5nbG9iYWxzLnBhbkwubWVtb3J5LnZhbHVlcy5pZHhcbiAgICAgICAgYnVmZmVyUiA9IEdpYmJlcmlzaC5nZW5pc2guZ2VuLmdsb2JhbHMucGFuUi5tZW1vcnkudmFsdWVzLmlkeFxuICAgICAgfVxuXG4gICAgICAvLyBYWFggbXVzdCBiZSBzYW1lIHR5cGUgYXMgd2hhdCBpcyByZXR1cm5lZCBieSBnZW5pc2ggZm9yIHR5cGUgY2hlY2tzIHRvIHdvcmsgY29ycmVjdGx5XG4gICAgICBjb25zdCBvdXRwdXQgPSBuZXcgRmxvYXQ2NEFycmF5KCAyICkgXG5cbiAgICAgIGNvbnN0IGJ1cyA9IE9iamVjdC5jcmVhdGUoIEJ1czIgKVxuXG4gICAgICBsZXQgaW5pdCA9IGZhbHNlXG5cbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgQnVzMi5kZWZhdWx0cywgX19wcm9wcyApXG5cbiAgICAgIE9iamVjdC5hc3NpZ24oIFxuICAgICAgICBidXMsXG5cbiAgICAgICAge1xuICAgICAgICAgIGNhbGxiYWNrKCkge1xuICAgICAgICAgICAgb3V0cHV0WyAwIF0gPSBvdXRwdXRbIDEgXSA9IDBcbiAgICAgICAgICAgIGNvbnN0IGxhc3RJZHggPSBhcmd1bWVudHMubGVuZ3RoIC0gMVxuICAgICAgICAgICAgY29uc3QgbWVtb3J5ICA9IGFyZ3VtZW50c1sgbGFzdElkeCBdXG4gICAgICAgICAgICBjb25zdCBwYW4gID0gYXJndW1lbnRzWyBsYXN0SWR4IC0gMSBdXG4gICAgICAgICAgICBjb25zdCBnYWluID0gYXJndW1lbnRzWyBsYXN0SWR4IC0gMiBdXG5cbiAgICAgICAgICAgIGZvciggbGV0IGkgPSAwOyBpIDwgbGFzdElkeCAtIDI7IGkrPSAzICkge1xuICAgICAgICAgICAgICBjb25zdCBpbnB1dCA9IGFyZ3VtZW50c1sgaSBdLFxuICAgICAgICAgICAgICAgICAgICBsZXZlbCA9IGFyZ3VtZW50c1sgaSArIDEgXSxcbiAgICAgICAgICAgICAgICAgICAgaXNTdGVyZW8gPSBhcmd1bWVudHNbIGkgKyAyIF1cblxuICAgICAgICAgICAgICBvdXRwdXRbIDAgXSArPSBpc1N0ZXJlbyA9PT0gdHJ1ZSA/IGlucHV0WyAwIF0gKiBsZXZlbCA6IGlucHV0ICogbGV2ZWxcblxuICAgICAgICAgICAgICBvdXRwdXRbIDEgXSArPSBpc1N0ZXJlbyA9PT0gdHJ1ZSA/IGlucHV0WyAxIF0gKiBsZXZlbCA6IGlucHV0ICogbGV2ZWxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFuUmF3SW5kZXggID0gcGFuICogMTAyMyxcbiAgICAgICAgICAgICAgICAgIHBhbkJhc2VJbmRleCA9IHBhblJhd0luZGV4IHwgMCxcbiAgICAgICAgICAgICAgICAgIHBhbk5leHRJbmRleCA9IChwYW5CYXNlSW5kZXggKyAxKSAmIDEwMjMsXG4gICAgICAgICAgICAgICAgICBpbnRlcnBBbW91bnQgPSBwYW5SYXdJbmRleCAtIHBhbkJhc2VJbmRleCxcbiAgICAgICAgICAgICAgICAgIHBhbkwgPSBtZW1vcnlbIGJ1ZmZlckwgKyBwYW5CYXNlSW5kZXggXSBcbiAgICAgICAgICAgICAgICAgICAgKyAoIGludGVycEFtb3VudCAqICggbWVtb3J5WyBidWZmZXJMICsgcGFuTmV4dEluZGV4IF0gLSBtZW1vcnlbIGJ1ZmZlckwgKyBwYW5CYXNlSW5kZXggXSApICksXG4gICAgICAgICAgICAgICAgICBwYW5SID0gbWVtb3J5WyBidWZmZXJSICsgcGFuQmFzZUluZGV4IF0gXG4gICAgICAgICAgICAgICAgICAgICsgKCBpbnRlcnBBbW91bnQgKiAoIG1lbW9yeVsgYnVmZmVyUiArIHBhbk5leHRJbmRleCBdIC0gbWVtb3J5WyBidWZmZXJSICsgcGFuQmFzZUluZGV4IF0gKSApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG91dHB1dFswXSAqPSBnYWluICogcGFuTFxuICAgICAgICAgICAgb3V0cHV0WzFdICo9IGdhaW4gKiBwYW5SXG5cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRcbiAgICAgICAgICB9LFxuICAgICAgICAgIGlkIDogR2liYmVyaXNoLmZhY3RvcnkuZ2V0VUlEKCksXG4gICAgICAgICAgZGlydHkgOiBmYWxzZSxcbiAgICAgICAgICB0eXBlIDogJ2J1cycsXG4gICAgICAgICAgaW5wdXRzOlsgMSwgLjUgXSxcbiAgICAgICAgICBpc1N0ZXJlbzogdHJ1ZSxcbiAgICAgICAgICBfX3Byb3BlcnRpZXNfXzpwcm9wc1xuICAgICAgICB9LFxuXG4gICAgICAgIEJ1czIuZGVmYXVsdHMsXG5cbiAgICAgICAgcHJvcHNcbiAgICAgIClcblxuICAgICAgYnVzLnVnZW5OYW1lID0gYnVzLmNhbGxiYWNrLnVnZW5OYW1lID0gJ2J1czJfJyArIGJ1cy5pZFxuXG4gICAgICBjb25zdCBvdXQgPSBidXMuX191c2VQcm94eV9fID09PSB0cnVlID8gcHJveHkoIFsnQnVzMiddLCBwcm9wcywgYnVzICkgOiBidXNcblxuXG4gICAgICAvLyB3ZSBoYXZlIHRvIGluY2x1ZGUgY3VzdG9tIHByb3BlcnRpZXMgZm9yIHRoZXNlIGFzIHRoZSBhcmd1bWVudCBsaXN0IGZvclxuICAgICAgLy8gdGhlIGNvbXBpbGVkIG91dHB1dCBmdW5jdGlvbiBpcyB2YXJpYWJsZVxuICAgICAgLy8gc28gY29kZWdlbiBjYW4ndCBrbm93IHRoZSBjb3JyZWN0IGFyZ3VtZW50IG9yZGVyIGZvciB0aGUgZnVuY3Rpb25cbiAgICAgIGxldCBwYW4gPSAuNVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBvdXQsICdwYW4nLCB7XG4gICAgICAgIGdldCgpIHsgcmV0dXJuIHBhbiB9LFxuICAgICAgICBzZXQodil7IFxuICAgICAgICAgIHBhbiA9IHZcbiAgICAgICAgICBvdXQuaW5wdXRzWyBvdXQuaW5wdXRzLmxlbmd0aCAtIDEgXSA9IHBhblxuICAgICAgICAgIEdpYmJlcmlzaC5kaXJ0eSggb3V0IClcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgbGV0IGdhaW4gPSAxXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG91dCwgJ2dhaW4nLCB7XG4gICAgICAgIGdldCgpIHsgcmV0dXJuIHBhbiB9LFxuICAgICAgICBzZXQodil7IFxuICAgICAgICAgIGdhaW4gPSB2XG4gICAgICAgICAgb3V0LmlucHV0c1sgb3V0LmlucHV0cy5sZW5ndGggLSAyIF0gPSBnYWluXG4gICAgICAgICAgR2liYmVyaXNoLmRpcnR5KCBvdXQgKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gb3V0XG4gICAgfSxcbiAgICBcbiAgICBkaXNjb25uZWN0VWdlbiggdWdlbiApIHtcbiAgICAgIGxldCByZW1vdmVJZHggPSB0aGlzLmlucHV0cy5pbmRleE9mKCB1Z2VuIClcblxuICAgICAgaWYoIHJlbW92ZUlkeCAhPT0gLTEgKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzLnNwbGljZSggcmVtb3ZlSWR4LCAzIClcbiAgICAgICAgR2liYmVyaXNoLmRpcnR5KCB0aGlzIClcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGVmYXVsdHM6IHsgZ2FpbjoxLCBwYW46LjUsIF9fdXNlUHJveHlfXzp0cnVlIH1cbiAgfSlcblxuICBjb25zdCBjb25zdHJ1Y3RvciA9IEJ1czIuY3JlYXRlLmJpbmQoIEJ1czIgKVxuICBjb25zdHJ1Y3Rvci5kZWZhdWx0cyA9IEJ1czIuZGVmYXVsdHNcblxuICByZXR1cm4gY29uc3RydWN0b3JcblxufVxuIiwiY29uc3QgIGcgICAgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyAgKSxcbiAgICAgICB1Z2VuID0gcmVxdWlyZSggJy4uL3VnZW4uanMnICkoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbiAgY29uc3QgTW9ub3BzID0ge1xuICAgIGV4cG9ydCggb2JqICkge1xuICAgICAgZm9yKCBsZXQga2V5IGluIE1vbm9wcyApIHtcbiAgICAgICAgaWYoIGtleSAhPT0gJ2V4cG9ydCcgKSB7XG4gICAgICAgICAgb2JqWyBrZXkgXSA9IE1vbm9wc1sga2V5IF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgQWJzKCBpbnB1dCApIHtcbiAgICAgIGNvbnN0IGFicyA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuICAgICAgY29uc3QgZ3JhcGggPSBnLmFicyggZy5pbignaW5wdXQnKSApXG4gICAgICBcbiAgICAgIGNvbnN0IF9fb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIGFicywgZ3JhcGgsIFsnbW9ub3BzJywnYWJzJ10sIE9iamVjdC5hc3NpZ24oe30sIE1vbm9wcy5kZWZhdWx0cywgeyBpbnB1dHM6W2lucHV0XSwgaXNvcDp0cnVlIH0pIClcblxuICAgICAgcmV0dXJuIF9fb3V0XG4gICAgfSxcblxuICAgIFBvdyggaW5wdXQsIGV4cG9uZW50ICkge1xuICAgICAgY29uc3QgcG93ID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG4gICAgICBjb25zdCBncmFwaCA9IGcucG93KCBnLmluKCdpbnB1dCcpLCBnLmluKCdleHBvbmVudCcpIClcbiAgICAgIFxuICAgICAgR2liYmVyaXNoLmZhY3RvcnkoIHBvdywgZ3JhcGgsIFsnbW9ub3BzJywncG93J10sIE9iamVjdC5hc3NpZ24oe30sIE1vbm9wcy5kZWZhdWx0cywgeyBpbnB1dHM6W2lucHV0XSwgZXhwb25lbnQsIGlzb3A6dHJ1ZSB9KSApXG5cbiAgICAgIHJldHVybiBwb3dcbiAgICB9LFxuICAgIENsYW1wKCBpbnB1dCwgbWluLCBtYXggKSB7XG4gICAgICBjb25zdCBjbGFtcCA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuICAgICAgY29uc3QgZ3JhcGggPSBnLmNsYW1wKCBnLmluKCdpbnB1dCcpLCBnLmluKCdtaW4nKSwgZy5pbignbWF4JykgKVxuICAgICAgXG4gICAgICBjb25zdCBfX291dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCBjbGFtcCwgZ3JhcGgsIFsnbW9ub3BzJywnY2xhbXAnXSwgT2JqZWN0LmFzc2lnbih7fSwgTW9ub3BzLmRlZmF1bHRzLCB7IGlucHV0czpbaW5wdXRdLCBpc29wOnRydWUsIG1pbiwgbWF4IH0pIClcblxuICAgICAgcmV0dXJuIF9fb3V0XG4gICAgfSxcblxuICAgIE1lcmdlKCBpbnB1dCApIHtcbiAgICAgIGNvbnN0IG1lcmdlciA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuICAgICAgY29uc3QgY2IgPSBmdW5jdGlvbiggX2lucHV0ICkge1xuICAgICAgICByZXR1cm4gX2lucHV0WzBdICsgX2lucHV0WzFdXG4gICAgICB9XG5cbiAgICAgIEdpYmJlcmlzaC5mYWN0b3J5KCBtZXJnZXIsIGcuaW4oICdpbnB1dCcgKSwgWydtb25vcHMnLCdtZXJnZSddLCB7IGlucHV0czpbaW5wdXRdLCBpc29wOnRydWUgfSwgY2IgKVxuICAgICAgbWVyZ2VyLnR5cGUgPSAnYW5hbHlzaXMnXG4gICAgICBtZXJnZXIuaW5wdXROYW1lcyA9IFsgJ2lucHV0JyBdXG4gICAgICBtZXJnZXIuaW5wdXRzID0gWyBpbnB1dCBdXG4gICAgICBtZXJnZXIuaW5wdXQgPSBpbnB1dFxuICAgICAgXG4gICAgICByZXR1cm4gbWVyZ2VyXG4gICAgfSxcbiAgfVxuXG4gIE1vbm9wcy5kZWZhdWx0cyA9IHsgaW5wdXQ6MCB9XG5cbiAgcmV0dXJuIE1vbm9wc1xufVxuIiwiY29uc3QgZyA9IHJlcXVpcmUoICdnZW5pc2guanMnIClcblxuY29uc3QgdWdlbiA9IHJlcXVpcmUoICcuLi91Z2VuLmpzJyApKClcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuIFxubGV0IFBhbm5lciA9IGlucHV0UHJvcHMgPT4ge1xuICBjb25zdCBwcm9wcyAgPSBPYmplY3QuYXNzaWduKCB7fSwgUGFubmVyLmRlZmF1bHRzLCBpbnB1dFByb3BzICksXG4gICAgICAgIHBhbm5lciA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuXG4gIGNvbnN0IGlzU3RlcmVvID0gcHJvcHMuaW5wdXQuaXNTdGVyZW8gIT09IHVuZGVmaW5lZCA/IHByb3BzLmlucHV0LmlzU3RlcmVvIDogQXJyYXkuaXNBcnJheSggcHJvcHMuaW5wdXQgKSBcbiAgXG4gIGNvbnN0IGlucHV0ID0gZy5pbiggJ2lucHV0JyApLFxuICAgICAgICBwYW4gICA9IGcuaW4oICdwYW4nIClcblxuICBsZXQgZ3JhcGggXG4gIGlmKCBpc1N0ZXJlbyApIHtcbiAgICBncmFwaCA9IGcucGFuKCBpbnB1dFswXSwgaW5wdXRbMV0sIHBhbiApICBcbiAgfWVsc2V7XG4gICAgZ3JhcGggPSBnLnBhbiggaW5wdXQsIGlucHV0LCBwYW4gKVxuICB9XG5cbiAgR2liYmVyaXNoLmZhY3RvcnkoIHBhbm5lciwgWyBncmFwaC5sZWZ0LCBncmFwaC5yaWdodF0sIFsncGFubmVyJ10sIHByb3BzIClcbiAgXG4gIHJldHVybiBwYW5uZXJcbn1cblxuUGFubmVyLmRlZmF1bHRzID0ge1xuICBpbnB1dDowLFxuICBwYW46LjVcbn1cblxucmV0dXJuIFBhbm5lciBcblxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuXG4gIGNvbnN0IFRpbWUgPSB7XG4gICAgYnBtOiAxMjAsXG5cbiAgICBleHBvcnQ6IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgT2JqZWN0LmFzc2lnbiggdGFyZ2V0LCBUaW1lIClcbiAgICB9LFxuXG4gICAgbXMgOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHJldHVybiB2YWwgKiBHaWJiZXJpc2guY3R4LnNhbXBsZVJhdGUgLyAxMDAwO1xuICAgIH0sXG5cbiAgICBzZWNvbmRzIDogZnVuY3Rpb24odmFsKSB7XG4gICAgICByZXR1cm4gdmFsICogR2liYmVyaXNoLmN0eC5zYW1wbGVSYXRlO1xuICAgIH0sXG5cbiAgICBiZWF0cyA6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgdmFyIHNhbXBsZXNQZXJCZWF0ID0gR2liYmVyaXNoLmN0eC5zYW1wbGVSYXRlIC8gKCBHaWJiZXJpc2guVGltZS5icG0gLyA2MCApIDtcbiAgICAgICAgcmV0dXJuIHNhbXBsZXNQZXJCZWF0ICogdmFsIDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gVGltZVxufVxuIiwiY29uc3QgZ2VuaXNoID0gcmVxdWlyZSgnZ2VuaXNoLmpzJyksXG4gICAgICBzc2QgPSBnZW5pc2guaGlzdG9yeSxcbiAgICAgIG5vaXNlID0gZ2VuaXNoLm5vaXNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgXCJ1c2UganNkc3BcIjtcblxuICBjb25zdCBsYXN0ID0gc3NkKDApO1xuXG4gIGNvbnN0IHdoaXRlID0gZ2VuaXNoLnN1YihnZW5pc2gubXVsKG5vaXNlKCksIDIpLCAxKTtcblxuICBsZXQgb3V0ID0gZ2VuaXNoLmFkZChsYXN0Lm91dCwgZ2VuaXNoLmRpdihnZW5pc2gubXVsKC4wMiwgd2hpdGUpLCAxLjAyKSk7XG5cbiAgbGFzdC5pbihvdXQpO1xuXG4gIG91dCA9IGdlbmlzaC5tdWwob3V0LCAzLjUpO1xuXG4gIHJldHVybiBvdXQ7XG59OyIsImxldCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKVxuXG5sZXQgZmVlZGJhY2tPc2MgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBmaWx0ZXIsIHB1bHNld2lkdGg9LjUsIGFyZ3VtZW50UHJvcHMgKSB7XG4gIGlmKCBhcmd1bWVudFByb3BzID09PSB1bmRlZmluZWQgKSBhcmd1bWVudFByb3BzID0geyB0eXBlOiAwIH1cblxuICBsZXQgbGFzdFNhbXBsZSA9IGcuaGlzdG9yeSgpLFxuICAgICAgLy8gZGV0ZXJtaW5lIHBoYXNlIGluY3JlbWVudCBhbmQgbWVtb2l6ZSByZXN1bHRcbiAgICAgIHcgPSBnLm1lbW8oIGcuZGl2KCBmcmVxdWVuY3ksIGcuZ2VuLnNhbXBsZXJhdGUgKSApLFxuICAgICAgLy8gY3JlYXRlIHNjYWxpbmcgZmFjdG9yXG4gICAgICBuID0gZy5zdWIoIC0uNSwgdyApLFxuICAgICAgc2NhbGluZyA9IGcubXVsKCBnLm11bCggMTMsIGZpbHRlciApLCBnLnBvdyggbiwgNSApICksXG4gICAgICAvLyBjYWxjdWxhdGUgZGMgb2Zmc2V0IGFuZCBub3JtYWxpemF0aW9uIGZhY3RvcnNcbiAgICAgIERDID0gZy5zdWIoIC4zNzYsIGcubXVsKCB3LCAuNzUyICkgKSxcbiAgICAgIG5vcm0gPSBnLnN1YiggMSwgZy5tdWwoIDIsIHcgKSApLFxuICAgICAgLy8gZGV0ZXJtaW5lIHBoYXNlXG4gICAgICBvc2MxUGhhc2UgPSBnLmFjY3VtKCB3LCAwLCB7IG1pbjotMSB9KSxcbiAgICAgIG9zYzEsIG91dFxuXG4gIC8vIGNyZWF0ZSBjdXJyZW50IHNhbXBsZS4uLiBmcm9tIHRoZSBwYXBlcjpcbiAgLy8gb3NjID0gKG9zYyArIHNpbigyKnBpKihwaGFzZSArIG9zYypzY2FsaW5nKSkpKjAuNWY7XG4gIG9zYzEgPSBnLm1lbW8oIFxuICAgIGcubXVsKFxuICAgICAgZy5hZGQoXG4gICAgICAgIGxhc3RTYW1wbGUub3V0LFxuICAgICAgICBnLnNpbihcbiAgICAgICAgICBnLm11bChcbiAgICAgICAgICAgIE1hdGguUEkgKiAyLFxuICAgICAgICAgICAgZy5tZW1vKCBnLmFkZCggb3NjMVBoYXNlLCBnLm11bCggbGFzdFNhbXBsZS5vdXQsIHNjYWxpbmcgKSApIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICksXG4gICAgICAuNVxuICAgIClcbiAgKVxuXG4gIC8vIHN0b3JlIHNhbXBsZSB0byB1c2UgYXMgbW9kdWxhdGlvblxuICBsYXN0U2FtcGxlLmluKCBvc2MxIClcblxuICAvLyBpZiBwd20gLyBzcXVhcmUgd2F2ZWZvcm0gaW5zdGVhZCBvZiBzYXd0b290aC4uLlxuICBpZiggYXJndW1lbnRQcm9wcy50eXBlID09PSAxICkgeyBcbiAgICBjb25zdCBsYXN0U2FtcGxlMiA9IGcuaGlzdG9yeSgpIC8vIGZvciBvc2MgMlxuICAgIGNvbnN0IGxhc3RTYW1wbGVNYXN0ZXIgPSBnLmhpc3RvcnkoKSAvLyBmb3Igc3VtIG9mIG9zYzEsb3NjMlxuXG4gICAgY29uc3Qgb3NjMiA9IGcubXVsKFxuICAgICAgZy5hZGQoXG4gICAgICAgIGxhc3RTYW1wbGUyLm91dCxcbiAgICAgICAgZy5zaW4oXG4gICAgICAgICAgZy5tdWwoXG4gICAgICAgICAgICBNYXRoLlBJICogMixcbiAgICAgICAgICAgIGcubWVtbyggZy5hZGQoIG9zYzFQaGFzZSwgZy5tdWwoIGxhc3RTYW1wbGUyLm91dCwgc2NhbGluZyApLCBwdWxzZXdpZHRoICkgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSxcbiAgICAgIC41XG4gICAgKVxuXG4gICAgbGFzdFNhbXBsZTIuaW4oIG9zYzIgKVxuICAgIG91dCA9IGcubWVtbyggZy5zdWIoIGxhc3RTYW1wbGUub3V0LCBsYXN0U2FtcGxlMi5vdXQgKSApXG4gICAgb3V0ID0gZy5tZW1vKCBnLmFkZCggZy5tdWwoIDIuNSwgb3V0ICksIGcubXVsKCAtMS41LCBsYXN0U2FtcGxlTWFzdGVyLm91dCApICkgKVxuICAgIFxuICAgIGxhc3RTYW1wbGVNYXN0ZXIuaW4oIGcuc3ViKCBvc2MxLCBvc2MyICkgKVxuXG4gIH1lbHNle1xuICAgICAvLyBvZmZzZXQgYW5kIG5vcm1hbGl6ZVxuICAgIG9zYzEgPSBnLmFkZCggZy5tdWwoIDIuNSwgb3NjMSApLCBnLm11bCggLTEuNSwgbGFzdFNhbXBsZS5vdXQgKSApXG4gICAgb3NjMSA9IGcuYWRkKCBvc2MxLCBEQyApXG4gXG4gICAgb3V0ID0gb3NjMVxuICB9XG5cbiAgcmV0dXJuIGcubXVsKCBvdXQsIG5vcm0gKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZlZWRiYWNrT3NjXG4iLCJjb25zdCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICAgIHVnZW4gPSByZXF1aXJlKCAnLi4vdWdlbi5qcycgKSgpLFxuICAgICAgZmVlZGJhY2tPc2MgPSByZXF1aXJlKCAnLi9mbWZlZWRiYWNrb3NjLmpzJyApXG5cbi8vICBfX21ha2VPc2NpbGxhdG9yX18oIHR5cGUsIGZyZXF1ZW5jeSwgYW50aWFsaWFzICkge1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggR2liYmVyaXNoICkge1xuICBsZXQgT3NjaWxsYXRvcnMgPSB7XG4gICAgZXhwb3J0KCBvYmogKSB7XG4gICAgICBmb3IoIGxldCBrZXkgaW4gT3NjaWxsYXRvcnMgKSB7XG4gICAgICAgIGlmKCBrZXkgIT09ICdleHBvcnQnICkge1xuICAgICAgICAgIG9ialsga2V5IF0gPSBPc2NpbGxhdG9yc1sga2V5IF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBnZW5pc2g6IHtcbiAgICAgIEJyb3duOiByZXF1aXJlKCAnLi9icm93bm5vaXNlLmpzJyApLFxuICAgICAgUGluazogIHJlcXVpcmUoICcuL3Bpbmtub2lzZS5qcycgIClcbiAgICB9LFxuXG4gICAgV2F2ZXRhYmxlOiByZXF1aXJlKCAnLi93YXZldGFibGUuanMnICkoIEdpYmJlcmlzaCApLFxuICAgIFxuICAgIFNxdWFyZSggaW5wdXRQcm9wcyApIHtcbiAgICAgIGNvbnN0IHNxciAgID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApIFxuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHsgYW50aWFsaWFzOmZhbHNlIH0sIE9zY2lsbGF0b3JzLmRlZmF1bHRzLCBpbnB1dFByb3BzIClcbiAgICAgIGNvbnN0IG9zYyAgID0gT3NjaWxsYXRvcnMuZmFjdG9yeSggJ3NxdWFyZScsIGcuaW4oICdmcmVxdWVuY3knICksIHByb3BzLmFudGlhbGlhcyApXG4gICAgICBjb25zdCBncmFwaCA9IGcubXVsKCBvc2MsIGcuaW4oJ2dhaW4nICkgKVxuXG4gICAgICBjb25zdCBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggc3FyLCBncmFwaCwgWydvc2NpbGxhdG9ycycsJ3NxdWFyZSddLCBwcm9wcyApXG5cbiAgICAgIHJldHVybiBvdXRcbiAgICB9LFxuXG4gICAgVHJpYW5nbGUoIGlucHV0UHJvcHMgKSB7XG4gICAgICBjb25zdCB0cmk9IE9iamVjdC5jcmVhdGUoIHVnZW4gKSBcbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmFzc2lnbih7IGFudGlhbGlhczpmYWxzZSB9LCBPc2NpbGxhdG9ycy5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgICBjb25zdCBvc2MgICA9IE9zY2lsbGF0b3JzLmZhY3RvcnkoICd0cmlhbmdsZScsIGcuaW4oICdmcmVxdWVuY3knICksIHByb3BzLmFudGlhbGlhcyApXG4gICAgICBjb25zdCBncmFwaCA9IGcubXVsKCBvc2MsIGcuaW4oJ2dhaW4nICkgKVxuXG4gICAgICBjb25zdCBvdXQgPUdpYmJlcmlzaC5mYWN0b3J5KCB0cmksIGdyYXBoLCBbJ29zY2lsbGF0b3JzJywndHJpYW5nbGUnXSwgcHJvcHMgKVxuXG4gICAgICByZXR1cm4gb3V0XG4gICAgfSxcblxuICAgIFBXTSggaW5wdXRQcm9wcyApIHtcbiAgICAgIGNvbnN0IHB3bSAgID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApIFxuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHsgYW50aWFsaWFzOmZhbHNlLCBwdWxzZXdpZHRoOi4yNSB9LCBPc2NpbGxhdG9ycy5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgICBjb25zdCBvc2MgICA9IE9zY2lsbGF0b3JzLmZhY3RvcnkoICdwd20nLCBnLmluKCAnZnJlcXVlbmN5JyApLCBwcm9wcy5hbnRpYWxpYXMgKVxuICAgICAgY29uc3QgZ3JhcGggPSBnLm11bCggb3NjLCBnLmluKCdnYWluJyApIClcblxuICAgICAgY29uc3Qgb3V0ID0gR2liYmVyaXNoLmZhY3RvcnkoIHB3bSwgZ3JhcGgsIFsnb3NjaWxsYXRvcnMnLCdQV00nXSwgcHJvcHMgKVxuXG4gICAgICByZXR1cm4gb3V0XG4gICAgfSxcblxuICAgIFNpbmUoIGlucHV0UHJvcHMgKSB7XG4gICAgICBjb25zdCBzaW5lICA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCBPc2NpbGxhdG9ycy5kZWZhdWx0cywgaW5wdXRQcm9wcyApXG4gICAgICBjb25zdCBncmFwaCA9IGcubXVsKCBnLmN5Y2xlKCBnLmluKCdmcmVxdWVuY3knKSApLCBnLmluKCdnYWluJykgKVxuXG4gICAgICBjb25zdCBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggc2luZSwgZ3JhcGgsIFsnb3NjaWxsYXRvcnMnLCdzaW5lJ10sIHByb3BzIClcbiAgICAgIFxuICAgICAgcmV0dXJuIG91dFxuICAgIH0sXG5cbiAgICBOb2lzZSggaW5wdXRQcm9wcyApIHtcbiAgICAgIGNvbnN0IG5vaXNlID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oIHt9LCB7IGdhaW46IDEsIGNvbG9yOid3aGl0ZScgfSwgaW5wdXRQcm9wcyApXG4gICAgICBsZXQgZ3JhcGggXG5cbiAgICAgIHN3aXRjaCggcHJvcHMuY29sb3IgKSB7XG4gICAgICAgIGNhc2UgJ2Jyb3duJzpcbiAgICAgICAgICBncmFwaCA9IGcubXVsKCBPc2NpbGxhdG9ycy5nZW5pc2guQnJvd24oKSwgZy5pbignZ2FpbicpIClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncGluayc6XG4gICAgICAgICAgZ3JhcGggPSBnLm11bCggT3NjaWxsYXRvcnMuZ2VuaXNoLlBpbmsoKSwgZy5pbignZ2FpbicpIClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBncmFwaCA9IGcubXVsKCBnLm5vaXNlKCksIGcuaW4oJ2dhaW4nKSApXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG91dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCBub2lzZSwgZ3JhcGgsIFsnb3NjaWxsYXRvcnMnLCdub2lzZSddLCBwcm9wcyApXG5cbiAgICAgIHJldHVybiBvdXRcbiAgICB9LFxuXG4gICAgU2F3KCBpbnB1dFByb3BzICkge1xuICAgICAgY29uc3Qgc2F3ICAgPSBPYmplY3QuY3JlYXRlKCB1Z2VuICkgXG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oeyBhbnRpYWxpYXM6ZmFsc2UgfSwgT3NjaWxsYXRvcnMuZGVmYXVsdHMsIGlucHV0UHJvcHMgKVxuICAgICAgY29uc3Qgb3NjICAgPSBPc2NpbGxhdG9ycy5mYWN0b3J5KCAnc2F3JywgZy5pbiggJ2ZyZXF1ZW5jeScgKSwgcHJvcHMuYW50aWFsaWFzIClcbiAgICAgIGNvbnN0IGdyYXBoID0gZy5tdWwoIG9zYywgZy5pbignZ2FpbicgKSApXG5cbiAgICAgIGNvbnN0IG91dCA9IEdpYmJlcmlzaC5mYWN0b3J5KCBzYXcsIGdyYXBoLCBbJ29zY2lsbGF0b3JzJywnc2F3J10sIHByb3BzIClcblxuICAgICAgcmV0dXJuIG91dFxuICAgIH0sXG5cbiAgICBSZXZlcnNlU2F3KCBpbnB1dFByb3BzICkge1xuICAgICAgY29uc3Qgc2F3ICAgPSBPYmplY3QuY3JlYXRlKCB1Z2VuICkgXG4gICAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5hc3NpZ24oeyBhbnRpYWxpYXM6ZmFsc2UgfSwgT3NjaWxsYXRvcnMuZGVmYXVsdHMsIGlucHV0UHJvcHMgKVxuICAgICAgY29uc3Qgb3NjICAgPSBnLnN1YiggMSwgT3NjaWxsYXRvcnMuZmFjdG9yeSggJ3NhdycsIGcuaW4oICdmcmVxdWVuY3knICksIHByb3BzLmFudGlhbGlhcyApIClcbiAgICAgIGNvbnN0IGdyYXBoID0gZy5tdWwoIG9zYywgZy5pbiggJ2dhaW4nICkgKVxuXG4gICAgICBjb25zdCBvdXQgPSBHaWJiZXJpc2guZmFjdG9yeSggc2F3LCBncmFwaCwgWydvc2NpbGxhdG9ycycsJ1JldmVyc2VTYXcnXSwgcHJvcHMgKVxuICAgICAgXG4gICAgICByZXR1cm4gb3V0XG4gICAgfSxcblxuICAgIGZhY3RvcnkoIHR5cGUsIGZyZXF1ZW5jeSwgYW50aWFsaWFzPWZhbHNlICkge1xuICAgICAgbGV0IG9zY1xuXG4gICAgICBzd2l0Y2goIHR5cGUgKSB7XG4gICAgICAgIGNhc2UgJ3B3bSc6XG4gICAgICAgICAgbGV0IHB1bHNld2lkdGggPSBnLmluKCdwdWxzZXdpZHRoJylcbiAgICAgICAgICBpZiggYW50aWFsaWFzID09PSB0cnVlICkge1xuICAgICAgICAgICAgb3NjID0gZmVlZGJhY2tPc2MoIGZyZXF1ZW5jeSwgMSwgcHVsc2V3aWR0aCwgeyB0eXBlOjEgfSlcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxldCBwaGFzZSA9IGcucGhhc29yKCBmcmVxdWVuY3ksIDAsIHsgbWluOjAgfSApXG4gICAgICAgICAgICBvc2MgPSBnLmx0KCBwaGFzZSwgcHVsc2V3aWR0aCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzYXcnOlxuICAgICAgICAgIGlmKCBhbnRpYWxpYXMgPT09IGZhbHNlICkge1xuICAgICAgICAgICAgb3NjID0gZy5waGFzb3IoIGZyZXF1ZW5jeSApXG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBvc2MgPSBmZWVkYmFja09zYyggZnJlcXVlbmN5LCAxIClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NpbmUnOlxuICAgICAgICAgIG9zYyA9IGcuY3ljbGUoIGZyZXF1ZW5jeSApXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NxdWFyZSc6XG4gICAgICAgICAgaWYoIGFudGlhbGlhcyA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIG9zYyA9IGZlZWRiYWNrT3NjKCBmcmVxdWVuY3ksIDEsIC41LCB7IHR5cGU6MSB9KVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgb3NjID0gZy53YXZldGFibGUoIGZyZXF1ZW5jeSwgeyBidWZmZXI6T3NjaWxsYXRvcnMuU3F1YXJlLmJ1ZmZlciwgbmFtZTonc3F1YXJlJyB9IClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RyaWFuZ2xlJzpcbiAgICAgICAgICBvc2MgPSBnLndhdmV0YWJsZSggZnJlcXVlbmN5LCB7IGJ1ZmZlcjpPc2NpbGxhdG9ycy5UcmlhbmdsZS5idWZmZXIsIG5hbWU6J3RyaWFuZ2xlJyB9IClcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9zY1xuICAgIH1cbiAgfVxuXG4gIE9zY2lsbGF0b3JzLlNxdWFyZS5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0IClcblxuICBmb3IoIGxldCBpID0gMTAyMzsgaSA+PSAwOyBpLS0gKSB7IFxuICAgIE9zY2lsbGF0b3JzLlNxdWFyZS5idWZmZXIgWyBpIF0gPSBpIC8gMTAyNCA+IC41ID8gMSA6IC0xXG4gIH1cblxuICBPc2NpbGxhdG9ycy5UcmlhbmdsZS5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KCAxMDI0IClcblxuICBcbiAgZm9yKCBsZXQgaSA9IDEwMjQ7IGktLTsgaSA9IGkgKSB7IE9zY2lsbGF0b3JzLlRyaWFuZ2xlLmJ1ZmZlcltpXSA9IDEgLSA0ICogTWF0aC5hYnMoKCAoaSAvIDEwMjQpICsgMC4yNSkgJSAxIC0gMC41KTsgfVxuXG4gIE9zY2lsbGF0b3JzLmRlZmF1bHRzID0ge1xuICAgIGZyZXF1ZW5jeTogNDQwLFxuICAgIGdhaW46IDFcbiAgfVxuXG4gIHJldHVybiBPc2NpbGxhdG9yc1xuXG59XG4iLCJjb25zdCBnZW5pc2ggPSByZXF1aXJlKCdnZW5pc2guanMnKSxcbiAgICAgIHNzZCA9IGdlbmlzaC5oaXN0b3J5LFxuICAgICAgZGF0YSA9IGdlbmlzaC5kYXRhLFxuICAgICAgbm9pc2UgPSBnZW5pc2gubm9pc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICBcInVzZSBqc2RzcFwiO1xuXG4gIGNvbnN0IGIgPSBkYXRhKDgsIDEsIHsgbWV0YTogdHJ1ZSB9KTtcbiAgY29uc3Qgd2hpdGUgPSBnZW5pc2guc3ViKGdlbmlzaC5tdWwobm9pc2UoKSwgMiksIDEpO1xuXG4gIGJbMF0gPSBnZW5pc2guYWRkKGdlbmlzaC5tdWwoLjk5ODg2LCBiWzBdKSwgZ2VuaXNoLm11bCh3aGl0ZSwgLjA1NTUxNzkpKTtcbiAgYlsxXSA9IGdlbmlzaC5hZGQoZ2VuaXNoLm11bCguOTkzMzIsIGJbMV0pLCBnZW5pc2gubXVsKHdoaXRlLCAuMDc1MDU3OSkpO1xuICBiWzJdID0gZ2VuaXNoLmFkZChnZW5pc2gubXVsKC45NjkwMCwgYlsyXSksIGdlbmlzaC5tdWwod2hpdGUsIC4xNTM4NTIwKSk7XG4gIGJbM10gPSBnZW5pc2guYWRkKGdlbmlzaC5tdWwoLjg4NjUwLCBiWzNdKSwgZ2VuaXNoLm11bCh3aGl0ZSwgLjMxMDQ4NTYpKTtcbiAgYls0XSA9IGdlbmlzaC5hZGQoZ2VuaXNoLm11bCguNTUwMDAsIGJbNF0pLCBnZW5pc2gubXVsKHdoaXRlLCAuNTMyOTUyMikpO1xuICBiWzVdID0gZ2VuaXNoLnN1YihnZW5pc2gubXVsKC0uNzYxNiwgYls1XSksIGdlbmlzaC5tdWwod2hpdGUsIC4wMTY4OTgwKSk7XG5cbiAgY29uc3Qgb3V0ID0gZ2VuaXNoLm11bChnZW5pc2guYWRkKGdlbmlzaC5hZGQoZ2VuaXNoLmFkZChnZW5pc2guYWRkKGdlbmlzaC5hZGQoZ2VuaXNoLmFkZChnZW5pc2guYWRkKGJbMF0sIGJbMV0pLCBiWzJdKSwgYlszXSksIGJbNF0pLCBiWzVdKSwgYls2XSksIGdlbmlzaC5tdWwod2hpdGUsIC41MzYyKSksIC4xMSk7XG5cbiAgYls2XSA9IGdlbmlzaC5tdWwod2hpdGUsIC4xMTU5MjYpO1xuXG4gIHJldHVybiBvdXQ7XG59OyIsImxldCBnID0gcmVxdWlyZSggJ2dlbmlzaC5qcycgKSxcbiAgICB1Z2VuID0gcmVxdWlyZSggJy4uL3VnZW4uanMnICkoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbiAgY29uc3QgV2F2ZXRhYmxlID0gZnVuY3Rpb24oIGlucHV0UHJvcHMgKSB7XG4gICAgY29uc3Qgd2F2ZXRhYmxlID0gT2JqZWN0LmNyZWF0ZSggdWdlbiApXG4gICAgY29uc3QgcHJvcHMgID0gT2JqZWN0LmFzc2lnbih7fSwgR2liYmVyaXNoLm9zY2lsbGF0b3JzLmRlZmF1bHRzLCBpbnB1dFByb3BzIClcbiAgICBjb25zdCBvc2MgPSBnLndhdmV0YWJsZSggZy5pbignZnJlcXVlbmN5JyksIHByb3BzIClcbiAgICBjb25zdCBncmFwaCA9IGcubXVsKCBcbiAgICAgIG9zYywgXG4gICAgICBnLmluKCAnZ2FpbicgKVxuICAgIClcblxuICAgIEdpYmJlcmlzaC5mYWN0b3J5KCB3YXZldGFibGUsIGdyYXBoLCAnd2F2ZXRhYmxlJywgcHJvcHMgKVxuXG4gICAgcmV0dXJuIHdhdmV0YWJsZVxuICB9XG5cbiAgZy53YXZldGFibGUgPSBmdW5jdGlvbiggZnJlcXVlbmN5LCBwcm9wcyApIHtcbiAgICBsZXQgZGF0YVByb3BzID0geyBpbW11dGFibGU6dHJ1ZSB9XG5cbiAgICAvLyB1c2UgZ2xvYmFsIHJlZmVyZW5jZXMgaWYgYXBwbGljYWJsZVxuICAgIGlmKCBwcm9wcy5uYW1lICE9PSB1bmRlZmluZWQgKSBkYXRhUHJvcHMuZ2xvYmFsID0gcHJvcHMubmFtZVxuXG4gICAgY29uc3QgYnVmZmVyID0gZy5kYXRhKCBwcm9wcy5idWZmZXIsIDEsIGRhdGFQcm9wcyApXG5cbiAgICByZXR1cm4gZy5wZWVrKCBidWZmZXIsIGcucGhhc29yKCBmcmVxdWVuY3ksIDAsIHsgbWluOjAgfSApIClcbiAgfVxuXG4gIHJldHVybiBXYXZldGFibGVcbn1cbiIsImNvbnN0IFF1ZXVlID0gcmVxdWlyZSggJy4uL2V4dGVybmFsL3ByaW9yaXR5cXVldWUuanMnIClcbmNvbnN0IEJpZyAgID0gcmVxdWlyZSggJ2JpZy5qcycgKVxuXG5sZXQgU2NoZWR1bGVyID0ge1xuICBwaGFzZTogMCxcblxuICBxdWV1ZTogbmV3IFF1ZXVlKCAoIGEsIGIgKSA9PiB7XG4gICAgaWYoIGEudGltZSA9PT0gYi50aW1lICkgeyAvL2EudGltZS5lcSggYi50aW1lICkgKSB7XG4gICAgICByZXR1cm4gYS5wcmlvcml0eSA8IGIucHJpb3JpdHkgPyAtMSA6IGEucHJpb3JpdHkgPiBiLnByaW9yaXR5ID8gMSA6IDA7XG4vL2IucHJpb3JpdHkgLSBhLnByaW9yaXR5IFxuXG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gYS50aW1lIC0gYi50aW1lIC8vYS50aW1lLm1pbnVzKCBiLnRpbWUgKVxuICAgIH1cbiAgfSksXG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5xdWV1ZS5kYXRhLmxlbmd0aCA9IDBcbiAgICB0aGlzLnF1ZXVlLmxlbmd0aCA9IDBcbiAgfSxcblxuICBhZGQoIHRpbWUsIGZ1bmMsIHByaW9yaXR5ID0gMCApIHtcbiAgICB0aW1lICs9IHRoaXMucGhhc2VcblxuICAgIHRoaXMucXVldWUucHVzaCh7IHRpbWUsIGZ1bmMsIHByaW9yaXR5IH0pXG4gIH0sXG5cbiAgdGljaygpIHtcbiAgICBpZiggdGhpcy5xdWV1ZS5sZW5ndGggKSB7XG4gICAgICBsZXQgbmV4dCA9IHRoaXMucXVldWUucGVlaygpXG5cbiAgICAgIGlmKCBpc05hTiggbmV4dC50aW1lICkgKSB7XG4gICAgICAgIHRoaXMucXVldWUucG9wKClcbiAgICAgIH1cbiAgICAgIFxuICAgICAgd2hpbGUoIHRoaXMucGhhc2UgPj0gbmV4dC50aW1lICkge1xuICAgICAgICBuZXh0LmZ1bmMoIG5leHQucHJpb3JpdHkgKVxuICAgICAgICB0aGlzLnF1ZXVlLnBvcCgpXG4gICAgICAgIG5leHQgPSB0aGlzLnF1ZXVlLnBlZWsoKVxuXG4gICAgICAgIC8vIFhYWCB0aGlzIGhhcHBlbnMgd2hlbiBjYWxsaW5nIHNlcXVlbmNlci5zdG9wKCkuLi4gd2h5P1xuICAgICAgICBpZiggbmV4dCA9PT0gdW5kZWZpbmVkICkgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBoYXNlKytcbiAgfSxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY2hlZHVsZXJcbiIsImNvbnN0IGcgPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApLFxuICAgICAgX19wcm94eSA9IHJlcXVpcmUoICcuLi93b3JrbGV0UHJveHkuanMnICksXG4gICAgICB1Z2VuID0gcmVxdWlyZSggJy4uL3VnZW4uanMnICkoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGNvbnN0IF9fcHJvdG9fXyA9IE9iamVjdC5jcmVhdGUoIHVnZW4gKVxuXG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcblxuICBPYmplY3QuYXNzaWduKCBfX3Byb3RvX18sIHtcbiAgICBzdGFydCggZGVsYXk9MCApIHtcbiAgICAgIGlmKCBkZWxheSAhPT0gMCApIHtcbiAgICAgICAgR2liYmVyaXNoLnNjaGVkdWxlci5hZGQoIGRlbGF5LCAoKT0+IHtcbiAgICAgICAgICBHaWJiZXJpc2guYW5hbHl6ZXJzLnB1c2goIHRoaXMgKVxuICAgICAgICAgIEdpYmJlcmlzaC5kaXJ0eSggR2liYmVyaXNoLmFuYWx5emVycyApXG4gICAgICAgIH0pXG4gICAgICB9ZWxzZXtcbiAgICAgICAgR2liYmVyaXNoLmFuYWx5emVycy5wdXNoKCB0aGlzIClcbiAgICAgICAgR2liYmVyaXNoLmRpcnR5KCBHaWJiZXJpc2guYW5hbHl6ZXJzIClcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcbiAgICBzdG9wKCkge1xuICAgICAgY29uc3QgaWR4ID0gR2liYmVyaXNoLmFuYWx5emVycy5pbmRleE9mKCB0aGlzIClcbiAgICAgIEdpYmJlcmlzaC5hbmFseXplcnMuc3BsaWNlKCBpZHgsIDEgKVxuICAgICAgR2liYmVyaXNoLmRpcnR5KCBHaWJiZXJpc2guYW5hbHl6ZXJzIClcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICB9KVxuXG4gIC8vIFhYWCB3ZSBuZWVkIHRvIGltcGxlbWVudCBwcmlvcml0eSwgd2hpY2ggd2lsbCBpbiB0dXJuIGRldGVybWluZSB0aGUgb3JkZXJcbiAgLy8gdGhhdCB0aGUgc2VxdWVuY2VycyBhcmUgYWRkZWQgdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICBjb25zdCBTZXEyID0geyBcbiAgICBjcmVhdGUoIGlucHV0UHJvcHMgKSB7XG4gICAgICBjb25zdCBzZXEgPSBPYmplY3QuY3JlYXRlKCBfX3Byb3RvX18gKSxcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBPYmplY3QuYXNzaWduKHt9LCBTZXEyLmRlZmF1bHRzLCBpbnB1dFByb3BzIClcblxuICAgICAgc2VxLnBoYXNlID0gMFxuICAgICAgc2VxLmlucHV0TmFtZXMgPSBbICdyYXRlJyBdXG4gICAgICBzZXEuaW5wdXRzID0gWyAxIF1cbiAgICAgIHNlcS5uZXh0VGltZSA9IDBcbiAgICAgIHNlcS5fX3ZhbHVlc1BoYXNlID0gMFxuICAgICAgc2VxLl9fdGltaW5nc1BoYXNlID0gMFxuICAgICAgc2VxLmlkID0gR2liYmVyaXNoLmZhY3RvcnkuZ2V0VUlEKClcbiAgICAgIHNlcS5kaXJ0eSA9IHRydWVcbiAgICAgIHNlcS50eXBlID0gJ3NlcSdcbiAgICAgIHNlcS5fX2FkZHJlc3Nlc19fID0ge31cblxuICAgICAgcHJvcGVydGllcy5pZCA9IEdpYmJlcmlzaC5mYWN0b3J5LmdldFVJRCgpXG5cbiAgICAgIE9iamVjdC5hc3NpZ24oIHNlcSwgcHJvcGVydGllcyApIFxuICAgICAgc2VxLl9fcHJvcGVydGllc19fID0gcHJvcGVydGllc1xuXG4gICAgICBcbiAgICAgIC8vIFhYWCB0aGlzIG5lZWRzIHRvIGJlIG9wdGltaXplZCBhcyBtdWNoIGFzIGh1bWFubHkgcG9zc2libGUsIHNpbmNlIGl0J3MgcnVubmluZyBhdCBhdWRpbyByYXRlLi4uXG4gICAgICBzZXEuY2FsbGJhY2sgPSBmdW5jdGlvbiggcmF0ZSApIHtcbiAgICAgICAgaWYoIHNlcS5waGFzZSA+PSBzZXEubmV4dFRpbWUgKSB7XG4gICAgICAgICAgbGV0IHZhbHVlICA9IHR5cGVvZiBzZXEudmFsdWVzICA9PT0gJ2Z1bmN0aW9uJyA/IHNlcS52YWx1ZXMgIDogc2VxLnZhbHVlc1sgc2VxLl9fdmFsdWVzUGhhc2UrKyAgJSBzZXEudmFsdWVzLmxlbmd0aCAgXSxcbiAgICAgICAgICB0aW1pbmcgPSB0eXBlb2Ygc2VxLnRpbWluZ3MgPT09ICdmdW5jdGlvbicgPyBzZXEudGltaW5ncyA6IHNlcS50aW1pbmdzWyBzZXEuX190aW1pbmdzUGhhc2UrKyAlIHNlcS50aW1pbmdzLmxlbmd0aCBdLFxuICAgICAgICAgIHNob3VsZFJ1biA9IHRydWVcblxuICAgICAgICAgIGlmKCB0eXBlb2YgdGltaW5nID09PSAnZnVuY3Rpb24nICkgdGltaW5nID0gdGltaW5nKClcblxuICAgICAgICAgIC8vIFhYWCB0aGlzIHN1cHBvcnRzIGFuIGVkZ2UgY2FzZSBpbiBHaWJiZXIsIHdoZXJlIHBhdHRlcm5zIGxpa2UgRXVjbGlkIC8gSGV4IHJldHVyblxuICAgICAgICAgIC8vIG9iamVjdHMgaW5kaWNhdGluZyBib3RoIHdoZXRoZXIgb3Igbm90IHRoZXkgc2hvdWxkIHNob3VsZCB0cmlnZ2VyIHZhbHVlcyBhcyB3ZWxsXG4gICAgICAgICAgLy8gYXMgdGhlIG5leHQgdGltZSB0aGV5IHNob3VsZCBydW4uIHBlcmhhcHMgdGhpcyBjb3VsZCBiZSBtYWRlIG1vcmUgZ2VuZXJhbGl6YWJsZT9cbiAgICAgICAgICBpZiggdHlwZW9mIHRpbWluZyA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICBpZiggdGltaW5nLnNob3VsZEV4ZWN1dGUgPT09IDEgKSB7XG4gICAgICAgICAgICAgIHNob3VsZFJ1biA9IHRydWVcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBzaG91bGRSdW4gPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGltaW5nID0gdGltaW5nLnRpbWUgXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoIHNob3VsZFJ1biApIHtcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgc2VxLnRhcmdldCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICB2YWx1ZSgpXG4gICAgICAgICAgICB9ZWxzZSBpZiggdHlwZW9mIHNlcS50YXJnZXRbIHNlcS5rZXkgXSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgaWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlKClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZXEudGFyZ2V0WyBzZXEua2V5IF0oIHZhbHVlIClcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBpZiggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICkgdmFsdWUgPSB2YWx1ZSgpXG4gICAgICAgICAgICAgIHNlcS50YXJnZXRbIHNlcS5rZXkgXSA9IHZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VxLnBoYXNlIC09IHNlcS5uZXh0VGltZVxuICAgICAgICAgIHNlcS5uZXh0VGltZSA9IHRpbWluZ1xuICAgICAgICB9XG5cbiAgICAgICAgc2VxLnBoYXNlICs9IHJhdGVcblxuICAgICAgICByZXR1cm4gMFxuICAgICAgfVxuXG4gICAgICBzZXEudWdlbk5hbWUgPSBzZXEuY2FsbGJhY2sudWdlbk5hbWUgPSAnc2VxXycgKyBzZXEuaWRcblxuICAgICAgLy8gc2luY2Ugd2UncmUgbm90IHBhc3Npbmcgb3VyIHNlcXVlbmNlciB0aHJvdWdoIHRoZSB1Z2VuIHRlbXBsYXRlLCB3ZSBuZWVkXG4gICAgICAvLyB0byBncmFiIGEgbWVtb3J5IGFkZHJlc3MgZm9yIGl0cyByYXRlIHNvIGl0IGNhbiBiZSBzZXF1ZW5jZWQgYW5kIGRlZmluZVxuICAgICAgLy8gYSBwcm9wZXJ0eSB0aGF0IG1hbmlwdWxhdGVzIHRoYXQgbWVtb3J5IGFkZHJlc3MuXG4gICAgICBjb25zdCBpZHggPSBHaWJiZXJpc2gubWVtb3J5LmFsbG9jKCAxIClcbiAgICAgIEdpYmJlcmlzaC5tZW1vcnkuaGVhcFsgaWR4IF0gPSBzZXEucmF0ZVxuICAgICAgc2VxLl9fYWRkcmVzc2VzX18ucmF0ZSA9IGlkeFxuXG4gICAgICBsZXQgdmFsdWUgPSBzZXEucmF0ZVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBzZXEsICdyYXRlJywge1xuICAgICAgICBnZXQoKSB7IHJldHVybiB2YWx1ZSB9LFxuICAgICAgICBzZXQoIHYgKSB7XG4gICAgICAgICAgaWYoIHZhbHVlICE9PSB2ICkge1xuICAgICAgICAgICAgaWYoIHR5cGVvZiB2ID09PSAnbnVtYmVyJyApIEdpYmJlcmlzaC5tZW1vcnkuaGVhcFsgaWR4IF0gPSB2XG5cbiAgICAgICAgICAgIEdpYmJlcmlzaC5kaXJ0eSggR2liYmVyaXNoLmFuYWx5emVycyApXG4gICAgICAgICAgICB2YWx1ZSA9IHZcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwcm94eSggWydTZXF1ZW5jZXIyJ10sIHByb3BlcnRpZXMsIHNlcSApIFxuICAgIH1cbiAgfVxuXG4gIFNlcTIuZGVmYXVsdHMgPSB7IHJhdGU6IDEsIHByaW9yaXR5OjAgfVxuXG4gIHJldHVybiBTZXEyLmNyZWF0ZVxuXG59XG5cbiIsImNvbnN0IF9fcHJveHkgPSByZXF1aXJlKCAnLi4vd29ya2xldFByb3h5LmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxuY29uc3QgcHJveHkgPSBfX3Byb3h5KCBHaWJiZXJpc2ggKVxuXG5jb25zdCBTZXF1ZW5jZXIgPSBwcm9wcyA9PiB7XG4gIGxldCBfX3NlcVxuICBjb25zdCBzZXEgPSB7XG4gICAgX19pc1J1bm5pbmc6ZmFsc2UsXG5cbiAgICBfX3ZhbHVlc1BoYXNlOiAgMCxcbiAgICBfX3RpbWluZ3NQaGFzZTogMCxcbiAgICBfX3R5cGU6J3NlcScsXG5cbiAgICB0aWNrKCBwcmlvcml0eSApIHtcbiAgICAgIGxldCB2YWx1ZSAgPSB0eXBlb2Ygc2VxLnZhbHVlcyAgPT09ICdmdW5jdGlvbicgPyBzZXEudmFsdWVzICA6IHNlcS52YWx1ZXNbICBzZXEuX192YWx1ZXNQaGFzZSsrICAlIHNlcS52YWx1ZXMubGVuZ3RoICBdLFxuICAgICAgICAgIHRpbWluZyA9IHR5cGVvZiBzZXEudGltaW5ncyA9PT0gJ2Z1bmN0aW9uJyA/IHNlcS50aW1pbmdzIDogc2VxLnRpbWluZ3NbIHNlcS5fX3RpbWluZ3NQaGFzZSsrICUgc2VxLnRpbWluZ3MubGVuZ3RoIF0sXG4gICAgICAgICAgc2hvdWxkUnVuID0gdHJ1ZVxuXG4gICAgICBpZiggdHlwZW9mIHRpbWluZyA9PT0gJ2Z1bmN0aW9uJyApIHRpbWluZyA9IHRpbWluZygpXG5cbiAgICAgIC8vIFhYWCB0aGlzIHN1cHBvcnRzIGFuIGVkZ2UgY2FzZSBpbiBHaWJiZXIsIHdoZXJlIHBhdHRlcm5zIGxpa2UgRXVjbGlkIC8gSGV4IHJldHVyblxuICAgICAgLy8gb2JqZWN0cyBpbmRpY2F0aW5nIGJvdGggd2hldGhlciBvciBub3QgdGhleSBzaG91bGQgc2hvdWxkIHRyaWdnZXIgdmFsdWVzIGFzIHdlbGxcbiAgICAgIC8vIGFzIHRoZSBuZXh0IHRpbWUgdGhleSBzaG91bGQgcnVuLiBwZXJoYXBzIHRoaXMgY291bGQgYmUgbWFkZSBtb3JlIGdlbmVyYWxpemFibGU/XG4gICAgICBpZiggdHlwZW9mIHRpbWluZyA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgIGlmKCB0aW1pbmcuc2hvdWxkRXhlY3V0ZSA9PT0gMSApIHtcbiAgICAgICAgICBzaG91bGRSdW4gPSB0cnVlXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHNob3VsZFJ1biA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgdGltaW5nID0gdGltaW5nLnRpbWUgXG4gICAgICB9XG5cbiAgICAgIHRpbWluZyAqPSBzZXEucmF0ZVxuXG4gICAgICBpZiggc2hvdWxkUnVuICkge1xuICAgICAgICBpZiggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIHNlcS50YXJnZXQgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICB2YWx1ZSgpXG4gICAgICAgIH1lbHNlIGlmKCB0eXBlb2Ygc2VxLnRhcmdldFsgc2VxLmtleSBdID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgIGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB2YWx1ZSA9IHZhbHVlKClcbiAgICAgICAgICBzZXEudGFyZ2V0WyBzZXEua2V5IF0oIHZhbHVlIClcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgaWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHZhbHVlID0gdmFsdWUoKVxuICAgICAgICAgIHNlcS50YXJnZXRbIHNlcS5rZXkgXSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAncHJvY2Vzc29yJyApIHtcbiAgICAgICAgaWYoIHNlcS5fX2lzUnVubmluZyA9PT0gdHJ1ZSAmJiAhaXNOYU4oIHRpbWluZyApICkge1xuICAgICAgICAgIEdpYmJlcmlzaC5zY2hlZHVsZXIuYWRkKCB0aW1pbmcsIHNlcS50aWNrLCBzZXEucHJpb3JpdHkgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHN0YXJ0KCBkZWxheSA9IDAgKSB7XG4gICAgICBzZXEuX19pc1J1bm5pbmcgPSB0cnVlXG4gICAgICBHaWJiZXJpc2guc2NoZWR1bGVyLmFkZCggZGVsYXksIHNlcS50aWNrLCBzZXEucHJpb3JpdHkgKVxuICAgICAgcmV0dXJuIF9fc2VxXG4gICAgfSxcblxuICAgIHN0b3AoKSB7XG4gICAgICBzZXEuX19pc1J1bm5pbmcgPSBmYWxzZVxuICAgICAgcmV0dXJuIF9fc2VxXG4gICAgfVxuICB9XG5cbiAgcHJvcHMuaWQgPSBHaWJiZXJpc2guZmFjdG9yeS5nZXRVSUQoKVxuXG4gIC8vIG5lZWQgYSBzZXBhcmF0ZSByZWZlcmVuY2UgdG8gdGhlIHByb3BlcnRpZXMgZm9yIHdvcmtsZXQgbWV0YS1wcm9ncmFtbWluZ1xuICBjb25zdCBwcm9wZXJ0aWVzID0gT2JqZWN0LmFzc2lnbigge30sIFNlcXVlbmNlci5kZWZhdWx0cywgcHJvcHMgKVxuICBPYmplY3QuYXNzaWduKCBzZXEsIHByb3BlcnRpZXMgKSBcbiAgc2VxLl9fcHJvcGVydGllc19fID0gcHJvcGVydGllc1xuXG4gIF9fc2VxID0gIHByb3h5KCBbJ1NlcXVlbmNlciddLCBwcm9wZXJ0aWVzLCBzZXEgKVxuXG4gIHJldHVybiBfX3NlcVxufVxuXG5TZXF1ZW5jZXIuZGVmYXVsdHMgPSB7IHByaW9yaXR5OjEwMDAwMCwgdmFsdWVzOltdLCB0aW1pbmdzOltdLCByYXRlOjEgfVxuXG5TZXF1ZW5jZXIubWFrZSA9IGZ1bmN0aW9uKCB2YWx1ZXMsIHRpbWluZ3MsIHRhcmdldCwga2V5LCBwcmlvcml0eSApIHtcbiAgcmV0dXJuIFNlcXVlbmNlcih7IHZhbHVlcywgdGltaW5ncywgdGFyZ2V0LCBrZXksIHByaW9yaXR5IH0pXG59XG5cbnJldHVybiBTZXF1ZW5jZXJcblxufVxuIiwibGV0IEdpYmJlcmlzaCA9IG51bGxcblxuY29uc3QgX191Z2VuID0gZnVuY3Rpb24oIF9fR2liYmVyaXNoICkge1xuICBpZiggX19HaWJiZXJpc2ggIT09IHVuZGVmaW5lZCAmJiBHaWJiZXJpc2ggPT0gbnVsbCApIEdpYmJlcmlzaCA9IF9fR2liYmVyaXNoXG4gXG4gIGNvbnN0IHJlcGxhY2UgPSBvYmogPT4ge1xuICAgIGlmKCB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyApIHtcbiAgICAgIGlmKCBvYmouaWQgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3Nvci51Z2Vucy5nZXQoIG9iai5pZCApXG4gICAgICB9IFxuICAgIH1cblxuICAgIHJldHVybiBvYmpcbiAgfVxuXG4gIGNvbnN0IHVnZW4gPSB7XG4gICAgX19HaWJiZXJpc2g6R2liYmVyaXNoLFxuXG4gICAgZnJlZTpmdW5jdGlvbigpIHtcbiAgICAgIEdpYmJlcmlzaC5nZW5pc2guZ2VuLmZyZWUoIHRoaXMuZ3JhcGggKVxuICAgIH0sXG5cbiAgICBwcmludDpmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCB0aGlzLmNhbGxiYWNrLnRvU3RyaW5nKCkgKVxuICAgIH0sXG5cbiAgICBjb25uZWN0OmZ1bmN0aW9uKCB0YXJnZXQsIGxldmVsPTEgKSB7XG4gICAgICBpZiggdGhpcy5jb25uZWN0ZWQgPT09IHVuZGVmaW5lZCApIHRoaXMuY29ubmVjdGVkID0gW11cblxuICAgICAgLy9sZXQgaW5wdXQgPSBsZXZlbCA9PT0gMSA/IHRoaXMgOiBHaWJiZXJpc2guYmlub3BzLk11bCggdGhpcywgbGV2ZWwgKVxuICAgICAgbGV0IGlucHV0ID0gdGhpc1xuXG4gICAgICBpZiggdGFyZ2V0ID09PSB1bmRlZmluZWQgfHwgdGFyZ2V0ID09PSBudWxsICkgdGFyZ2V0ID0gR2liYmVyaXNoLm91dHB1dCBcblxuXG4gICAgICAvLyBYWFggSSBmb3Jnb3QsIHdoZXJlIGlzIF9fYWRkSW5wdXQgZm91bmQ/IENhbiB3ZSBjb250cm9sIHRoZVxuICAgICAgLy8gbGV2ZWwgb2YgdGhlIGlucHV0P1xuICAgICAgaWYoIHR5cGVvZiB0YXJnZXQuX19hZGRJbnB1dCA9PSAnZnVuY3Rpb24nICkge1xuICAgICAgICB0YXJnZXQuX19hZGRJbnB1dCggaW5wdXQgKVxuICAgICAgfSBlbHNlIGlmKCB0YXJnZXQuc3VtICYmIHRhcmdldC5zdW0uaW5wdXRzICkge1xuICAgICAgICB0YXJnZXQuc3VtLmlucHV0cy5wdXNoKCBpbnB1dCApXG4gICAgICB9IGVsc2UgaWYoIHRhcmdldC5pbnB1dHMgKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRhcmdldC5pbnB1dHMuaW5kZXhPZiggaW5wdXQgKVxuXG4gICAgICAgIC8vIGlmIG5vIGNvbm5lY3Rpb24gZXhpc3RzLi4uXG4gICAgICAgIGlmKCBpZHggPT09IC0xICkge1xuICAgICAgICAgIHRhcmdldC5pbnB1dHMudW5zaGlmdCggaW5wdXQsIGxldmVsLCBpbnB1dC5pc1N0ZXJlbyApXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIC8vIC4uLiBvdGhlcndpc2UgdXBkYXRlIHRoZSBjb25uZWN0aW9uJ3MgbGV2ZWwsIHdoaWNoIGlzIHN0b3JlZFxuICAgICAgICAgIC8vIG9uZSBpbmRleCBoaWdoZXIgaW4gdGhlIGlucHV0IGxpc3QuXG4gICAgICAgICAgdGFyZ2V0LmlucHV0c1sgaWR4ICsgMSBdID0gbGV2ZWxcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0LmlucHV0ID0gaW5wdXRcbiAgICAgICAgdGFyZ2V0LmlucHV0R2FpbiA9IGxldmVsXG4gICAgICB9XG5cbiAgICAgIEdpYmJlcmlzaC5kaXJ0eSggdGFyZ2V0IClcblxuICAgICAgdGhpcy5jb25uZWN0ZWQucHVzaChbIHRhcmdldCwgaW5wdXQsIGxldmVsIF0pXG4gICAgICBcbiAgICAgIHJldHVybiB0aGlzXG4gICAgfSxcblxuICAgIGRpc2Nvbm5lY3Q6ZnVuY3Rpb24oIHRhcmdldCApIHtcbiAgICAgIGlmKCB0YXJnZXQgPT09IHVuZGVmaW5lZCApe1xuICAgICAgICBpZiggQXJyYXkuaXNBcnJheSggdGhpcy5jb25uZWN0ZWQgKSApIHtcbiAgICAgICAgICBmb3IoIGxldCBjb25uZWN0aW9uIG9mIHRoaXMuY29ubmVjdGVkICkge1xuICAgICAgICAgICAgaWYoIGNvbm5lY3Rpb25bMF0uZGlzY29ubmVjdFVnZW4gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgY29ubmVjdGlvblswXS5kaXNjb25uZWN0VWdlbiggY29ubmVjdGlvblsxXSApXG4gICAgICAgICAgICB9ZWxzZSBpZiggY29ubmVjdGlvblswXS5pbnB1dCA9PT0gdGhpcyApIHtcbiAgICAgICAgICAgICAgY29ubmVjdGlvblswXS5pbnB1dCA9IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5jb25uZWN0ZWQubGVuZ3RoID0gMFxuICAgICAgICB9XG4gICAgICB9ZWxzZXtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuY29ubmVjdGVkLmZpbmQoIHYgPT4gdlswXSA9PT0gdGFyZ2V0IClcbiAgICAgICAgLy8gaWYgdGFyZ2V0IGlzIGEgYnVzLi4uXG4gICAgICAgIGlmKCB0YXJnZXQuZGlzY29ubmVjdFVnZW4gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICBpZiggY29ubmVjdGlvbiAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgdGFyZ2V0LmRpc2Nvbm5lY3RVZ2VuKCBjb25uZWN0aW9uWzFdIClcbiAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIC8vIG11c3QgYmUgYW4gZWZmZWN0LCBzZXQgaW5wdXQgdG8gMFxuICAgICAgICAgIHRhcmdldC5pbnB1dCA9IDBcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldElkeCA9IHRoaXMuY29ubmVjdGVkLmluZGV4T2YoIGNvbm5lY3Rpb24gKVxuXG4gICAgICAgIGlmKCB0YXJnZXRJZHggIT09IC0xICkge1xuICAgICAgICAgIHRoaXMuY29ubmVjdGVkLnNwbGljZSggdGFyZ2V0SWR4LCAxIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBjaGFpbjpmdW5jdGlvbiggdGFyZ2V0LCBsZXZlbD0xICkge1xuICAgICAgdGhpcy5jb25uZWN0KCB0YXJnZXQsbGV2ZWwgKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgfSxcblxuICAgIF9fcmVkb0dyYXBoOmZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGlzU3RlcmVvID0gdGhpcy5pc1N0ZXJlb1xuICAgICAgdGhpcy5fX2NyZWF0ZUdyYXBoKClcbiAgICAgIHRoaXMuY2FsbGJhY2sgPSBHaWJiZXJpc2guZ2VuaXNoLmdlbi5jcmVhdGVDYWxsYmFjayggdGhpcy5ncmFwaCwgR2liYmVyaXNoLm1lbW9yeSwgZmFsc2UsIHRydWUgKVxuICAgICAgdGhpcy5pbnB1dE5hbWVzID0gbmV3IFNldCggR2liYmVyaXNoLmdlbmlzaC5nZW4ucGFyYW1ldGVycyApIFxuICAgICAgdGhpcy5jYWxsYmFjay51Z2VuTmFtZSA9IHRoaXMudWdlbk5hbWVcbiAgICAgIEdpYmJlcmlzaC5kaXJ0eSggdGhpcyApXG5cbiAgICAgIC8vIGlmIGNoYW5uZWwgY291bnQgaGFzIGNoYW5nZWQgYWZ0ZXIgcmVjb21waWxpbmcgZ3JhcGguLi5cbiAgICAgIGlmKCBpc1N0ZXJlbyAhPT0gdGhpcy5pc1N0ZXJlbyApIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZyggJ0NIQU5HSU5HIFNURVJFTzonLCBpc1N0ZXJlbyApXG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIGFueSBjb25uZWN0aW9ucyBiZWZvcmUgaXRlcmF0aW5nLi4uXG4gICAgICAgIGlmKCB0aGlzLmNvbm5lY3RlZCA9PT0gdW5kZWZpbmVkICkgcmV0dXJuXG4gICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgYnVzc2VzIHRoZSB1Z2VuIGlzIGNvbm5lY3RlZCB0b1xuICAgICAgICBmb3IoIGxldCBjb25uZWN0aW9uIG9mIHRoaXMuY29ubmVjdGVkICkge1xuICAgICAgICAgIC8vIHNldCB0aGUgZGlydHkgZmxhZyBvZiB0aGUgYnVzXG4gICAgICAgICAgR2liYmVyaXNoLmRpcnR5KCBjb25uZWN0aW9uWyAwIF0gKVxuXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGlucHV0cyBhcnJheSwgd2hpY2ggaW5kaWNhdGVzIGNvbm5lY3Rpb24gaXMgdG8gYSBidXNcbiAgICAgICAgICBpZiggY29ubmVjdGlvblswXS5pbnB1dHMgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIC8vIGZpbmQgdGhlIGlucHV0IGluIHRoZSBidXNzZXMgJ2lucHV0cycgYXJyYXlcbiAgICAgICAgICAgIGNvbnN0IGlucHV0SWR4ID0gY29ubmVjdGlvblsgMCBdLmlucHV0cy5pbmRleE9mKCBjb25uZWN0aW9uWyAxIF0gKVxuXG4gICAgICAgICAgICAvLyBhc3N1bWlpbmcgaXQgaXMgZm91bmQuLi5cbiAgICAgICAgICAgIGlmKCBpbnB1dElkeCAhPT0gLTEgKSB7XG4gICAgICAgICAgICAgIC8vIGNoYW5nZSBzdGVyZW8gZmllbGRcbiAgICAgICAgICAgICAgY29ubmVjdGlvblsgMCBdLmlucHV0c1sgaW5wdXRJZHggKyAyIF0gPSB0aGlzLmlzU3RlcmVvXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfWVsc2UgaWYoIGNvbm5lY3Rpb25bMF0uaW5wdXQgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIGlmKCBjb25uZWN0aW9uWzBdLl9fcmVkb0dyYXBoICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgIGNvbm5lY3Rpb25bMF0uX19yZWRvR3JhcGgoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gIH1cblxuICByZXR1cm4gdWdlblxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gX191Z2VuXG4iLCJjb25zdCBfX3Byb3h5ID0gcmVxdWlyZSggJy4vd29ya2xldFByb3h5LmpzJyApXG5jb25zdCBlZmZlY3RQcm90byA9IHJlcXVpcmUoICcuL2Z4L2VmZmVjdC5qcycgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG4gIGNvbnN0IHByb3h5ID0gX19wcm94eSggR2liYmVyaXNoIClcbiAgXG4gIGNvbnN0IGZhY3RvcnkgPSBmdW5jdGlvbiggdWdlbiwgZ3JhcGgsIF9fbmFtZSwgdmFsdWVzLCBjYj1udWxsLCBzaG91bGRQcm94eSA9IHRydWUgKSB7XG4gICAgdWdlbi5jYWxsYmFjayA9IGNiID09PSBudWxsID8gR2liYmVyaXNoLmdlbmlzaC5nZW4uY3JlYXRlQ2FsbGJhY2soIGdyYXBoLCBHaWJiZXJpc2gubWVtb3J5LCBmYWxzZSwgdHJ1ZSApIDogY2JcblxuICAgIGxldCBuYW1lID0gQXJyYXkuaXNBcnJheSggX19uYW1lICkgPyBfX25hbWVbIF9fbmFtZS5sZW5ndGggLSAxIF0gOiBfX25hbWVcblxuICAgIE9iamVjdC5hc3NpZ24oIHVnZW4sIHtcbiAgICAgIC8vdHlwZTogJ3VnZW4nLFxuICAgICAgaWQ6IHZhbHVlcy5pZCB8fCBHaWJiZXJpc2gudXRpbGl0aWVzLmdldFVJRCgpLCBcbiAgICAgIHVnZW5OYW1lOiBuYW1lICsgJ18nLFxuICAgICAgZ3JhcGg6IGdyYXBoLFxuICAgICAgaW5wdXROYW1lczogbmV3IFNldCggR2liYmVyaXNoLmdlbmlzaC5nZW4ucGFyYW1ldGVycyApLFxuICAgICAgaXNTdGVyZW86IEFycmF5LmlzQXJyYXkoIGdyYXBoICksXG4gICAgICBkaXJ0eTogdHJ1ZSxcbiAgICAgIF9fcHJvcGVydGllc19fOnZhbHVlcyxcbiAgICAgIF9fYWRkcmVzc2VzX186e31cbiAgICB9KVxuICAgIFxuICAgIHVnZW4udWdlbk5hbWUgKz0gdWdlbi5pZFxuICAgIHVnZW4uY2FsbGJhY2sudWdlbk5hbWUgPSB1Z2VuLnVnZW5OYW1lIC8vIFhYWCBoYWNreVxuICAgIHVnZW4uY2FsbGJhY2suaWQgPSB1Z2VuLmlkXG5cbiAgICBmb3IoIGxldCBwYXJhbSBvZiB1Z2VuLmlucHV0TmFtZXMgKSB7XG4gICAgICBpZiggcGFyYW0gPT09ICdtZW1vcnknICkgY29udGludWVcblxuICAgICAgbGV0IHZhbHVlID0gdmFsdWVzWyBwYXJhbSBdLFxuICAgICAgICAgIGlzTnVtYmVyID0gIWlzTmFOKCB2YWx1ZSApLFxuICAgICAgICAgIGlkeFxuXG4gICAgICBpZiggaXNOdW1iZXIgKSB7IFxuICAgICAgICBpZHggPSBHaWJiZXJpc2gubWVtb3J5LmFsbG9jKCAxIClcbiAgICAgICAgR2liYmVyaXNoLm1lbW9yeS5oZWFwWyBpZHggXSA9IHZhbHVlXG4gICAgICAgIHVnZW4uX19hZGRyZXNzZXNfX1sgcGFyYW0gXSA9IGlkeFxuICAgICAgfVxuXG4gICAgICAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRvIGNoZWNrIGZvciBhIHNldHRlcj9cbiAgICAgIGxldCBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciggdWdlbiwgcGFyYW0gKSxcbiAgICAgICAgICBzZXR0ZXJcblxuICAgICAgaWYoIGRlc2MgIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgc2V0dGVyID0gZGVzYy5zZXRcbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCB1Z2VuLCBwYXJhbSwge1xuICAgICAgICBjb25maWd1cmFibGU6dHJ1ZSxcbiAgICAgICAgZ2V0KCkgeyBcbiAgICAgICAgICBpZiggaXNOdW1iZXIgKSB7XG4gICAgICAgICAgICByZXR1cm4gR2liYmVyaXNoLm1lbW9yeS5oZWFwWyBpZHggXVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlIFxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0KCB2ICkge1xuICAgICAgICAgIC8vaWYoIHBhcmFtID09PSAnaW5wdXQnICkgY29uc29sZS5sb2coICdJTlBVVDonLCB2LCBpc051bWJlciApXG4gICAgICAgICAgaWYoIHZhbHVlICE9PSB2ICkge1xuICAgICAgICAgICAgaWYoIHNldHRlciAhPT0gdW5kZWZpbmVkICkgc2V0dGVyKCB2IClcbiAgICAgICAgICAgIGlmKCAhaXNOYU4oIHYgKSApIHtcbiAgICAgICAgICAgICAgR2liYmVyaXNoLm1lbW9yeS5oZWFwWyBpZHggXSA9IHZhbHVlID0gdlxuICAgICAgICAgICAgICBpZiggaXNOdW1iZXIgPT09IGZhbHNlICkgR2liYmVyaXNoLmRpcnR5KCB1Z2VuIClcbiAgICAgICAgICAgICAgaXNOdW1iZXIgPSB0cnVlXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2XG4gICAgICAgICAgICAgIC8qaWYoIGlzTnVtYmVyID09PSB0cnVlICkqLyBHaWJiZXJpc2guZGlydHkoIHVnZW4gKVxuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCAnc3dpdGNoaW5nIGZyb20gbnVtYmVyOicsIHBhcmFtLCB2YWx1ZSApXG4gICAgICAgICAgICAgIGlzTnVtYmVyID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gYWRkIGJ5cGFzcyBcbiAgICBpZiggZWZmZWN0UHJvdG8uaXNQcm90b3R5cGVPZiggdWdlbiApICkge1xuICAgICAgbGV0IHZhbHVlID0gdWdlbi5ieXBhc3NcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdWdlbiwgJ2J5cGFzcycsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOnRydWUsXG4gICAgICAgIGdldCgpIHsgcmV0dXJuIHZhbHVlIH0sXG4gICAgICAgIHNldCggdiApIHtcbiAgICAgICAgICBpZiggdmFsdWUgIT09IHYgKSB7XG4gICAgICAgICAgICBHaWJiZXJpc2guZGlydHkoIHVnZW4gKVxuICAgICAgICAgICAgdmFsdWUgPSB2XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgfVxuXG4gICAgaWYoIHVnZW4uX19yZXF1aXJlc1JlY29tcGlsYXRpb24gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHVnZW4uX19yZXF1aXJlc1JlY29tcGlsYXRpb24uZm9yRWFjaCggcHJvcCA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1sgcHJvcCBdXG4gICAgICAgIGxldCBpc051bWJlciA9ICFpc05hTiggdmFsdWUgKVxuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggdWdlbiwgcHJvcCwge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTp0cnVlLFxuICAgICAgICAgIGdldCgpIHsgXG4gICAgICAgICAgICBpZiggaXNOdW1iZXIgKSB7XG4gICAgICAgICAgICAgIGxldCBpZHggPSB1Z2VuLl9fYWRkcmVzc2VzX19bIHByb3AgXVxuICAgICAgICAgICAgICByZXR1cm4gR2liYmVyaXNoLm1lbW9yeS5oZWFwWyBpZHggXVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIC8vY29uc29sZS5sb2coICdyZXR1cm5pbmc6JywgcHJvcCwgdmFsdWUsIEdpYmJlcmlzaC5tb2RlIClcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlIFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2V0KCB2ICkge1xuICAgICAgICAgICAgaWYoIHZhbHVlICE9PSB2ICkge1xuICAgICAgICAgICAgICBpZiggIWlzTmFOKCB2ICkgKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlkeCA9IHVnZW4uX19hZGRyZXNzZXNfX1sgcHJvcCBdXG4gICAgICAgICAgICAgICAgaWYoIGlkeCA9PT0gdW5kZWZpbmVkICl7XG4gICAgICAgICAgICAgICAgICBpZHggPSBHaWJiZXJpc2gubWVtb3J5LmFsbG9jKCAxIClcbiAgICAgICAgICAgICAgICAgIHVnZW4uX19hZGRyZXNzZXNfX1sgcHJvcCBdID0gaWR4XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzWyBwcm9wIF0gPSBHaWJiZXJpc2gubWVtb3J5LmhlYXBbIGlkeCBdID0gdlxuICAgICAgICAgICAgICAgIGlzTnVtYmVyID0gdHJ1ZVxuICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1sgcHJvcCBdID0gdlxuICAgICAgICAgICAgICAgIGlzTnVtYmVyID0gZmFsc2VcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCAnc2V0dGluZyB1Z2VuJywgdmFsdWUsIEdpYmJlcmlzaC5tb2RlIClcbiAgICAgICAgICAgICAgICBHaWJiZXJpc2guZGlydHkoIHVnZW4gKVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyggJ1NFVFRJTkcgUkVETyBHUkFQSCcsIHByb3AsIEdpYmJlcmlzaC5tb2RlIClcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIG5lZWRlZCBmb3IgZmlsdGVyVHlwZSBhdCB0aGUgdmVyeSBsZWFzdCwgYmVjYXVhZSB0aGUgcHJvcHNcbiAgICAgICAgICAgICAgLy8gYXJlIHJldXNlZCB3aGVuIHJlLWNyZWF0aW5nIHRoZSBncmFwaC4gVGhpcyBzZWVtcyBsaWtlIGEgY2hlYXBlclxuICAgICAgICAgICAgICAvLyB3YXkgdG8gc29sdmUgdGhpcyBwcm9ibGVtLlxuICAgICAgICAgICAgICAvL3ZhbHVlc1sgcHJvcCBdID0gdlxuXG4gICAgICAgICAgICAgIHRoaXMuX19yZWRvR3JhcGgoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gd2lsbCBvbmx5IGNyZWF0ZSBwcm94eSBpZiB3b3JrbGV0cyBhcmUgYmVpbmcgdXNlZFxuICAgIC8vIG90aGVyd2lzZSB3aWxsIHJldHVybiB1bmFsdGVyZWQgdWdlblxuXG4gICAgaWYoIHZhbHVlcy5zaG91bGRBZGRUb1VnZW4gPT09IHRydWUgKSBPYmplY3QuYXNzaWduKCB1Z2VuLCB2YWx1ZXMgKVxuXG4gICAgcmV0dXJuIHNob3VsZFByb3h5ID8gcHJveHkoIF9fbmFtZSwgdmFsdWVzLCB1Z2VuICkgOiB1Z2VuXG4gIH1cblxuICBmYWN0b3J5LmdldFVJRCA9ICgpID0+IHsgcmV0dXJuIEdpYmJlcmlzaC51dGlsaXRpZXMuZ2V0VUlEKCkgfVxuXG4gIHJldHVybiBmYWN0b3J5XG59XG4iLCJjb25zdCBnZW5pc2ggPSByZXF1aXJlKCAnZ2VuaXNoLmpzJyApXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oIEdpYmJlcmlzaCApIHtcblxubGV0IHVpZCA9IDBcblxuY29uc3QgdXRpbGl0aWVzID0ge1xuICBjcmVhdGVDb250ZXh0KCBjdHgsIGNiLCByZXNvbHZlICkge1xuICAgIGxldCBBQyA9IHR5cGVvZiBBdWRpb0NvbnRleHQgPT09ICd1bmRlZmluZWQnID8gd2Via2l0QXVkaW9Db250ZXh0IDogQXVkaW9Db250ZXh0XG5cbiAgICBsZXQgc3RhcnQgPSAoKSA9PiB7XG4gICAgICBpZiggdHlwZW9mIEFDICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgR2liYmVyaXNoLmN0eCA9IGN0eCA9PT0gdW5kZWZpbmVkID8gbmV3IEFDKCkgOiBjdHhcbiAgICAgICAgZ2VuaXNoLmdlbi5zYW1wbGVyYXRlID0gR2liYmVyaXNoLmN0eC5zYW1wbGVSYXRlXG4gICAgICAgIGdlbmlzaC51dGlsaXRpZXMuY3R4ID0gR2liYmVyaXNoLmN0eFxuXG4gICAgICAgIGlmKCBkb2N1bWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICkge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAndG91Y2hzdGFydCcsIHN0YXJ0IClcblxuICAgICAgICAgIGlmKCAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgKXsgLy8gcmVxdWlyZWQgdG8gc3RhcnQgYXVkaW8gdW5kZXIgaU9TIDZcbiAgICAgICAgICAgIGxldCBteVNvdXJjZSA9IHV0aWxpdGllcy5jdHguY3JlYXRlQnVmZmVyU291cmNlKClcbiAgICAgICAgICAgIG15U291cmNlLmNvbm5lY3QoIHV0aWxpdGllcy5jdHguZGVzdGluYXRpb24gKVxuICAgICAgICAgICAgbXlTb3VyY2Uubm90ZU9uKCAwIClcbiAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAnbW91c2Vkb3duJywgc3RhcnQgKVxuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIHN0YXJ0IClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiggdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nICkgY2IoIHJlc29sdmUgKVxuICAgIH1cblxuICAgIGlmKCBkb2N1bWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICd0b3VjaHN0YXJ0Jywgc3RhcnQgKVxuICAgIH1lbHNle1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBzdGFydCApXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ2tleWRvd24nLCBzdGFydCApXG4gICAgfVxuXG4gICAgcmV0dXJuIEdpYmJlcmlzaC5jdHhcbiAgfSxcblxuICBjcmVhdGVTY3JpcHRQcm9jZXNzb3IoIHJlc29sdmUgKSB7XG4gICAgR2liYmVyaXNoLm5vZGUgPSBHaWJiZXJpc2guY3R4LmNyZWF0ZVNjcmlwdFByb2Nlc3NvciggMTAyNCwgMCwgMiApLFxuICAgIEdpYmJlcmlzaC5jbGVhckZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7IHJldHVybiAwIH0sXG4gICAgR2liYmVyaXNoLmNhbGxiYWNrID0gR2liYmVyaXNoLmNsZWFyRnVuY3Rpb25cblxuICAgIEdpYmJlcmlzaC5ub2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oIGF1ZGlvUHJvY2Vzc2luZ0V2ZW50ICkge1xuICAgICAgbGV0IGdpYmJlcmlzaCA9IEdpYmJlcmlzaCxcbiAgICAgICAgICBjYWxsYmFjayAgPSBnaWJiZXJpc2guY2FsbGJhY2ssXG4gICAgICAgICAgb3V0cHV0QnVmZmVyID0gYXVkaW9Qcm9jZXNzaW5nRXZlbnQub3V0cHV0QnVmZmVyLFxuICAgICAgICAgIHNjaGVkdWxlciA9IEdpYmJlcmlzaC5zY2hlZHVsZXIsXG4gICAgICAgICAgLy9vYmpzID0gZ2liYmVyaXNoLmNhbGxiYWNrVWdlbnMuc2xpY2UoIDAgKSxcbiAgICAgICAgICBsZW5ndGhcblxuICAgICAgbGV0IGxlZnQgPSBvdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoIDAgKSxcbiAgICAgICAgICByaWdodD0gb3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKCAxIClcblxuICAgICAgbGV0IGNhbGxiYWNrbGVuZ3RoID0gR2liYmVyaXNoLmJsb2NrQ2FsbGJhY2tzLmxlbmd0aFxuICAgICAgXG4gICAgICBpZiggY2FsbGJhY2tsZW5ndGggIT09IDAgKSB7XG4gICAgICAgIGZvciggbGV0IGk9MDsgaTwgY2FsbGJhY2tsZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICBHaWJiZXJpc2guYmxvY2tDYWxsYmFja3NbIGkgXSgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYW4ndCBqdXN0IHNldCBsZW5ndGggdG8gMCBhcyBjYWxsYmFja3MgbWlnaHQgYmUgYWRkZWQgZHVyaW5nIGZvciBsb29wLCBzbyBzcGxpY2UgcHJlLWV4aXN0aW5nIGZ1bmN0aW9uc1xuICAgICAgICBHaWJiZXJpc2guYmxvY2tDYWxsYmFja3Muc3BsaWNlKCAwLCBjYWxsYmFja2xlbmd0aCApXG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IHNhbXBsZSA9IDAsIGxlbmd0aCA9IGxlZnQubGVuZ3RoOyBzYW1wbGUgPCBsZW5ndGg7IHNhbXBsZSsrKSB7XG4gICAgICAgIHNjaGVkdWxlci50aWNrKClcblxuICAgICAgICBpZiggZ2liYmVyaXNoLmdyYXBoSXNEaXJ0eSApIHsgXG4gICAgICAgICAgY2FsbGJhY2sgPSBnaWJiZXJpc2guZ2VuZXJhdGVDYWxsYmFjaygpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFhYWCBjYW50IHVzZSBkZXN0cnVjdHVyaW5nLCBiYWJlbCBtYWtlcyBpdCBzb21ldGhpbmcgaW5lZmZpY2llbnQuLi5cbiAgICAgICAgbGV0IG91dCA9IGNhbGxiYWNrLmFwcGx5KCBudWxsLCBnaWJiZXJpc2guY2FsbGJhY2tVZ2VucyApXG5cbiAgICAgICAgbGVmdFsgc2FtcGxlICBdID0gb3V0WzBdXG4gICAgICAgIHJpZ2h0WyBzYW1wbGUgXSA9IG91dFsxXVxuICAgICAgfVxuICAgIH1cblxuICAgIEdpYmJlcmlzaC5ub2RlLmNvbm5lY3QoIEdpYmJlcmlzaC5jdHguZGVzdGluYXRpb24gKVxuXG4gICAgcmVzb2x2ZSgpXG5cbiAgICByZXR1cm4gR2liYmVyaXNoLm5vZGVcbiAgfSwgXG5cbiAgY3JlYXRlV29ya2xldCggcmVzb2x2ZSApIHtcbiAgICBHaWJiZXJpc2guY3R4LmF1ZGlvV29ya2xldC5hZGRNb2R1bGUoIEdpYmJlcmlzaC53b3JrbGV0UGF0aCApLnRoZW4oICgpID0+IHtcbiAgICAgIEdpYmJlcmlzaC53b3JrbGV0ID0gbmV3IEF1ZGlvV29ya2xldE5vZGUoIEdpYmJlcmlzaC5jdHgsICdnaWJiZXJpc2gnLCB7IG91dHB1dENoYW5uZWxDb3VudDpbMl0gfSApXG4gICAgICBHaWJiZXJpc2gud29ya2xldC5jb25uZWN0KCBHaWJiZXJpc2guY3R4LmRlc3RpbmF0aW9uIClcbiAgICAgIEdpYmJlcmlzaC53b3JrbGV0LnBvcnQub25tZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgICAgICBHaWJiZXJpc2gudXRpbGl0aWVzLndvcmtsZXRIYW5kbGVyc1sgZXZlbnQuZGF0YS5hZGRyZXNzIF0oIGV2ZW50ICkgICAgICAgIFxuICAgICAgfVxuICAgICAgR2liYmVyaXNoLndvcmtsZXQudWdlbnMgPSBuZXcgTWFwKClcblxuICAgICAgcmVzb2x2ZSgpXG4gICAgfSlcbiAgfSxcblxuICB3b3JrbGV0SGFuZGxlcnM6IHtcbiAgICBnZXQoIGV2ZW50ICkge1xuICAgICAgbGV0IG5hbWUgPSBldmVudC5kYXRhLm5hbWVcbiAgICAgIGxldCB2YWx1ZVxuICAgICAgaWYoIG5hbWVbMF0gPT09ICdHaWJiZXJpc2gnICkge1xuICAgICAgICB2YWx1ZSA9IEdpYmJlcmlzaFxuICAgICAgICBuYW1lLnNoaWZ0KClcbiAgICAgIH1cbiAgICAgIGZvciggbGV0IHNlZ21lbnQgb2YgbmFtZSApIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVsgc2VnbWVudCBdXG4gICAgICB9XG5cbiAgICAgIEdpYmJlcmlzaC53b3JrbGV0LnBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBhZGRyZXNzOidzZXQnLFxuICAgICAgICBuYW1lOidHaWJiZXJpc2guJyArIG5hbWUuam9pbignLicpLFxuICAgICAgICB2YWx1ZVxuICAgICAgfSlcbiAgICB9LFxuICAgIHN0YXRlKCBldmVudCApe1xuICAgICAgY29uc3QgbWVzc2FnZXMgPSBldmVudC5kYXRhLm1lc3NhZ2VzXG4gICAgICBpZiggbWVzc2FnZXMubGVuZ3RoID09PSAwICkgcmV0dXJuXG5cbiAgICAgIC8vIFhYWCBpcyBwcmV2ZW50UHJveHkgYWN0dWFsbHkgdXNlZD9cbiAgICAgIEdpYmJlcmlzaC5wcmV2ZW50UHJveHkgPSB0cnVlXG4gICAgICBHaWJiZXJpc2gucHJveHlFbmFibGVkID0gZmFsc2VcbiAgICAgIGZvciggbGV0IGkgPSAwOyBpIDwgbWVzc2FnZXMubGVuZ3RoOyBpKz0gMyApIHtcbiAgICAgICAgY29uc3QgaWQgPSBtZXNzYWdlc1sgaSBdIFxuICAgICAgICBjb25zdCBwcm9wTmFtZSA9IG1lc3NhZ2VzWyBpICsgMSBdXG4gICAgICAgIGNvbnN0IHZhbHVlID0gbWVzc2FnZXNbIGkgKyAyIF1cbiAgICAgICAgY29uc3Qgb2JqID0gR2liYmVyaXNoLndvcmtsZXQudWdlbnMuZ2V0KCBpZCApXG5cbiAgICAgICAgaWYoIG9iaiAhPT0gdW5kZWZpbmVkICYmIHByb3BOYW1lLmluZGV4T2YoJy4nKSA9PT0gLTEgJiYgcHJvcE5hbWUgIT09ICdpZCcgKSB7IFxuICAgICAgICAgIGlmKCBvYmpbIHByb3BOYW1lIF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIGlmKCB0eXBlb2Ygb2JqWyBwcm9wTmFtZSBdICE9PSAnZnVuY3Rpb24nICkge1xuICAgICAgICAgICAgICBvYmpbIHByb3BOYW1lIF0gPSB2YWx1ZVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIG9ialsgcHJvcE5hbWUgXSggdmFsdWUgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgb2JqWyBwcm9wTmFtZSBdID0gdmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgIH1lbHNlIGlmKCBvYmogIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICBjb25zdCBwcm9wU3BsaXQgPSBwcm9wTmFtZS5zcGxpdCgnLicpXG4gICAgICAgICAgaWYoIG9ialsgcHJvcFNwbGl0WyAwIF0gXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgaWYoIHR5cGVvZiBvYmpbIHByb3BTcGxpdFsgMCBdIF1bIHByb3BTcGxpdFsgMSBdIF0gIT09ICdmdW5jdGlvbicgKSB7XG4gICAgICAgICAgICAgIG9ialsgcHJvcFNwbGl0WyAwIF0gXVsgcHJvcFNwbGl0WyAxIF0gXSA9IHZhbHVlXG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgb2JqWyBwcm9wU3BsaXRbIDAgXSBdWyBwcm9wU3BsaXRbIDEgXSBdKCB2YWx1ZSApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCAndW5kZWZpbmVkIHNwbGl0IHByb3BlcnR5IScsIGlkLCBwcm9wU3BsaXRbMF0sIHByb3BTcGxpdFsxXSwgdmFsdWUsIG9iaiApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFhYWCBkb3VibGUgY2hlY2sgYW5kIG1ha2Ugc3VyZSB0aGlzIGlzbid0IGdldHRpbmcgc2VudCBiYWNrIHRvIHByb2Nlc3Nvcm5vZGUuLi5cbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb3BOYW1lLCB2YWx1ZSwgb2JqIClcbiAgICAgIH1cbiAgICAgIEdpYmJlcmlzaC5wcmV2ZW50UHJveHkgPSBmYWxzZVxuICAgICAgR2liYmVyaXNoLnByb3h5RW5hYmxlZCA9IHRydWVcbiAgICB9XG4gIH0sXG5cbiAgd3JhcCggZnVuYywgLi4uYXJncyApIHtcbiAgICBjb25zdCBvdXQgPSB7XG4gICAgICBhY3Rpb246J3dyYXAnLFxuICAgICAgdmFsdWU6ZnVuYyxcbiAgICAgIC8vIG11c3QgcmV0dXJuIG9iamVjdHMgY29udGFpbmluZyBvbmx5IHRoZSBpZCBudW1iZXIgdG8gYXZvaWRcbiAgICAgIC8vIGNyZWF0aW5nIGNpcmN1bGFyIEpTT04gcmVmZXJlbmNlcyB0aGF0IHdvdWxkIHJlc3VsdCBmcm9tIHBhc3NpbmcgYWN0dWFsIHVnZW5zXG4gICAgICBhcmdzOiBhcmdzLm1hcCggdiA9PiB7IHJldHVybiB7IGlkOnYuaWQgfSB9KVxuICAgIH1cbiAgICByZXR1cm4gb3V0XG4gIH0sXG5cbiAgZXhwb3J0KCBvYmogKSB7XG4gICAgb2JqLndyYXAgPSB0aGlzLndyYXBcbiAgfSxcblxuICBnZXRVSUQoKSB7IHJldHVybiB1aWQrKyB9XG59XG5cbnJldHVybiB1dGlsaXRpZXNcblxufVxuIiwiY29uc3Qgc2VyaWFsaXplID0gcmVxdWlyZSgnc2VyaWFsaXplLWphdmFzY3JpcHQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCBHaWJiZXJpc2ggKSB7XG5cbmNvbnN0IHJlcGxhY2VPYmogPSBmdW5jdGlvbiggb2JqLCBzaG91bGRTZXJpYWxpemVGdW5jdGlvbnMgPSB0cnVlICkge1xuICBpZiggdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqICE9PSBudWxsICYmIG9iai5pZCAhPT0gdW5kZWZpbmVkICkge1xuICAgIGlmKCBvYmouX190eXBlICE9PSAnc2VxJyApIHsgLy8gWFhYIHdoeT9cbiAgICAgIHJldHVybiB7IGlkOm9iai5pZCwgcHJvcDpvYmoucHJvcCB9XG4gICAgfWVsc2V7XG4gICAgICAvLyBzaG91bGRuJ3QgSSBiZSBzZXJpYWxpemluZyBtb3N0IG9iamVjdHMsIG5vdCBqdXN0IHNlcXM/XG4gICAgICByZXR1cm4gc2VyaWFsaXplKCBvYmogKVxuICAgIH1cbiAgfWVsc2UgaWYoIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgJiYgc2hvdWxkU2VyaWFsaXplRnVuY3Rpb25zID09PSB0cnVlICkge1xuICAgIHJldHVybiB7IGlzRnVuYzp0cnVlLCB2YWx1ZTpzZXJpYWxpemUoIG9iaiApIH1cbiAgfVxuICByZXR1cm4gb2JqXG59XG5cbmNvbnN0IG1ha2VBbmRTZW5kT2JqZWN0ID0gZnVuY3Rpb24oIF9fbmFtZSwgdmFsdWVzLCBvYmogKSB7XG4gIGNvbnN0IHByb3BlcnRpZXMgPSB7fVxuXG4gIC8vIG9iamVjdCBoYXMgYWxyZWFkeSBiZWVuIHNlbnQgdGhyb3VnaCBtZXNzYWdlcG9ydC4uLlxuXG4gIGZvciggbGV0IGtleSBpbiB2YWx1ZXMgKSB7XG4gICAgY29uc3QgYWxyZWFkeVByb2Nlc3NlZCA9ICh0eXBlb2YgdmFsdWVzWyBrZXkgXSA9PT0gJ29iamVjdCcgJiYgdmFsdWVzWyBrZXkgXSAhPT0gbnVsbCAmJiB2YWx1ZXNbIGtleSBdLl9fbWV0YV9fICE9PSB1bmRlZmluZWQpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlc1trZXldID09PSAnZnVuY3Rpb24nICYmIHZhbHVlc1sga2V5IF0uX19tZXRhX18gIT09IHVuZGVmaW5lZCApXG5cbiAgICBpZiggYWxyZWFkeVByb2Nlc3NlZCApIHsgXG4gICAgICBwcm9wZXJ0aWVzWyBrZXkgXSA9IHsgaWQ6dmFsdWVzWyBrZXkgXS5fX21ldGFfXy5pZCB9XG4gICAgfWVsc2UgaWYoIEFycmF5LmlzQXJyYXkoIHZhbHVlc1sga2V5IF0gKSApIHtcbiAgICAgIGNvbnN0IGFyciA9IFtdXG4gICAgICBmb3IoIGxldCBpID0gMDsgaSA8IHZhbHVlc1sga2V5IF0ubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIGFyclsgaSBdID0gcmVwbGFjZU9iaiggdmFsdWVzWyBrZXkgXVtpXSwgZmFsc2UgIClcbiAgICAgIH1cbiAgICAgIHByb3BlcnRpZXNbIGtleSBdID0gYXJyXG4gICAgfWVsc2UgaWYoIHR5cGVvZiB2YWx1ZXNba2V5XSA9PT0gJ29iamVjdCcgJiYgdmFsdWVzW2tleV0gIT09IG51bGwgKXtcbiAgICAgIHByb3BlcnRpZXNbIGtleSBdID0gcmVwbGFjZU9iaiggdmFsdWVzWyBrZXkgXSwgZmFsc2UgKVxuICAgIH1lbHNle1xuICAgICAgcHJvcGVydGllc1sga2V5IF0gPSB2YWx1ZXNbIGtleSBdXG4gICAgfVxuICB9XG5cbiAgbGV0IHNlcmlhbGl6ZWRQcm9wZXJ0aWVzID0gc2VyaWFsaXplKCBwcm9wZXJ0aWVzIClcblxuICBpZiggQXJyYXkuaXNBcnJheSggX19uYW1lICkgKSB7XG4gICAgY29uc3Qgb2xkTmFtZSA9IF9fbmFtZVsgX19uYW1lLmxlbmd0aCAtIDEgXVxuICAgIF9fbmFtZVsgX19uYW1lLmxlbmd0aCAtIDEgXSA9IG9sZE5hbWVbMF0udG9VcHBlckNhc2UoKSArIG9sZE5hbWUuc3Vic3RyaW5nKDEpXG4gIH1lbHNle1xuICAgIF9fbmFtZSA9IFsgX19uYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBfX25hbWUuc3Vic3RyaW5nKDEpIF1cbiAgfVxuXG4gIG9iai5fX21ldGFfXyA9IHtcbiAgICBhZGRyZXNzOidhZGQnLFxuICAgIG5hbWU6X19uYW1lLFxuICAgIHByb3BlcnRpZXM6c2VyaWFsaXplZFByb3BlcnRpZXMsIFxuICAgIGlkOm9iai5pZFxuICB9XG5cbiAgR2liYmVyaXNoLndvcmtsZXQudWdlbnMuc2V0KCBvYmouaWQsIG9iaiApXG5cbiAgR2liYmVyaXNoLndvcmtsZXQucG9ydC5wb3N0TWVzc2FnZSggb2JqLl9fbWV0YV9fIClcblxufVxuXG5jb25zdCBfX3Byb3h5ID0gZnVuY3Rpb24oIF9fbmFtZSwgdmFsdWVzLCBvYmogKSB7XG5cbiAgaWYoIEdpYmJlcmlzaC5tb2RlID09PSAnd29ya2xldCcgJiYgR2liYmVyaXNoLnByZXZlbnRQcm94eSA9PT0gZmFsc2UgKSB7XG5cbiAgICBtYWtlQW5kU2VuZE9iamVjdCggX19uYW1lLCB2YWx1ZXMsIG9iaiApXG5cbiAgICAvLyBwcm94eSBmb3IgYWxsIG1ldGhvZCBjYWxscyB0byBzZW5kIHRvIHdvcmtsZXRcbiAgICBjb25zdCBwcm94eSA9IG5ldyBQcm94eSggb2JqLCB7XG4gICAgICBnZXQoIHRhcmdldCwgcHJvcCwgcmVjZWl2ZXIgKSB7XG4gICAgICAgIGlmKCB0eXBlb2YgdGFyZ2V0WyBwcm9wIF0gPT09ICdmdW5jdGlvbicgJiYgcHJvcC5pbmRleE9mKCdfXycpID09PSAtMSkge1xuICAgICAgICAgIGNvbnN0IHByb3h5ID0gbmV3IFByb3h5KCB0YXJnZXRbIHByb3AgXSwge1xuICAgICAgICAgICAgYXBwbHkoIF9fdGFyZ2V0LCB0aGlzQXJnLCBhcmdzICkge1xuXG4gICAgICAgICAgICAgIGlmKCBHaWJiZXJpc2gucHJveHlFbmFibGVkID09PSB0cnVlICkge1xuICAgICAgICAgICAgICAgIGNvbnN0IF9fYXJncyA9IGFyZ3MubWFwKCBfX3ZhbHVlID0+IHJlcGxhY2VPYmooIF9fdmFsdWUsIHRydWUgKSApXG4gICAgICAgICAgICAgICAgLy9pZiggcHJvcCA9PT0gJ2Nvbm5lY3QnICkgY29uc29sZS5sb2coICdwcm94eSBjb25uZWN0OicsIF9fYXJncyApXG5cbiAgICAgICAgICAgICAgICBHaWJiZXJpc2gud29ya2xldC5wb3J0LnBvc3RNZXNzYWdlKHsgXG4gICAgICAgICAgICAgICAgICBhZGRyZXNzOidtZXRob2QnLCBcbiAgICAgICAgICAgICAgICAgIG9iamVjdDpvYmouaWQsXG4gICAgICAgICAgICAgICAgICBuYW1lOnByb3AsXG4gICAgICAgICAgICAgICAgICBhcmdzOl9fYXJnc1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCB0ZW1wID0gR2liYmVyaXNoLnByb3h5RW5hYmxlZFxuICAgICAgICAgICAgICBHaWJiZXJpc2gucHJveHlFbmFibGVkID0gZmFsc2VcbiAgICAgICAgICAgICAgY29uc3Qgb3V0ID0gIF9fdGFyZ2V0LmFwcGx5KCB0aGlzQXJnLCBhcmdzIClcbiAgICAgICAgICAgICAgR2liYmVyaXNoLnByb3h5RW5hYmxlZCA9IHRlbXBcbiAgICAgICAgICAgICAgcmV0dXJuIG91dFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgXG4gICAgICAgICAgcmV0dXJuIHByb3h5XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0WyBwcm9wIF1cbiAgICAgIH0sXG4gICAgICBzZXQoIHRhcmdldCwgcHJvcCwgdmFsdWUsIHJlY2VpdmVyICkge1xuICAgICAgICBpZiggcHJvcCAhPT0gJ2Nvbm5lY3RlZCcgJiYgcHJvcCAhPT0gJ2lucHV0JyAmJiBwcm9wICE9PSAnY2FsbGJhY2snICYmIHByb3AgIT09ICdpbnB1dE5hbWVzJyApIHtcbiAgICAgICAgICBpZiggR2liYmVyaXNoLnByb3h5RW5hYmxlZCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgICAgIGNvbnN0IF9fdmFsdWUgPSByZXBsYWNlT2JqKCB2YWx1ZSApXG5cbiAgICAgICAgICAgIGlmKCBfX3ZhbHVlICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgIEdpYmJlcmlzaC53b3JrbGV0LnBvcnQucG9zdE1lc3NhZ2UoeyBcbiAgICAgICAgICAgICAgICBhZGRyZXNzOidzZXQnLCBcbiAgICAgICAgICAgICAgICBvYmplY3Q6b2JqLmlkLFxuICAgICAgICAgICAgICAgIG5hbWU6cHJvcCxcbiAgICAgICAgICAgICAgICB2YWx1ZTpfX3ZhbHVlXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGFyZ2V0WyBwcm9wIF0gPSB2YWx1ZVxuXG4gICAgICAgIC8vIG11c3QgcmV0dXJuIHRydWUgZm9yIGFueSBFUzYgcHJveHkgc2V0dGVyXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFhYWCBYWFggWFhYIFhYWCBYWFggWFhYXG4gICAgLy8gUkVNRU1CRVIgVEhBVCBZT1UgTVVTVCBBU1NJR05FRCBUSEUgUkVUVVJORUQgVkFMVUUgVE8gWU9VUiBVR0VOLFxuICAgIC8vIFlPVSBDQU5OT1QgVVNFIFRISVMgRlVOQ1RJT04gVE8gTU9ESUZZIEEgVUdFTiBJTiBQTEFDRS5cbiAgICAvLyBYWFggWFhYIFhYWCBYWFggWFhYIFhYWFxuXG4gICAgcmV0dXJuIHByb3h5XG4gIH1lbHNlIGlmKCBHaWJiZXJpc2gubW9kZSA9PT0gJ3Byb2Nlc3NvcicgJiYgR2liYmVyaXNoLnByZXZlbnRQcm94eSA9PT0gZmFsc2UgKSB7XG5cbiAgICBjb25zdCBwcm94eSA9IG5ldyBQcm94eSggb2JqLCB7XG4gICAgICAvL2dldCggdGFyZ2V0LCBwcm9wLCByZWNlaXZlciApIHsgcmV0dXJuIHRhcmdldFsgcHJvcCBdIH0sXG4gICAgICBzZXQoIHRhcmdldCwgcHJvcCwgdmFsdWUsIHJlY2VpdmVyICkge1xuICAgICAgICBsZXQgdmFsdWVUeXBlID0gdHlwZW9mIHZhbHVlXG4gICAgICAgIGlmKCBwcm9wLmluZGV4T2YoJ19fJykgPT09IC0xICYmIHZhbHVlVHlwZSAhPT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZVR5cGUgIT09ICdvYmplY3QnICkge1xuICAgICAgICAgIGlmKCBHaWJiZXJpc2gucHJvY2Vzc29yICE9PSB1bmRlZmluZWQgKSB7IFxuICAgICAgICAgICAgR2liYmVyaXNoLnByb2Nlc3Nvci5tZXNzYWdlcy5wdXNoKCBvYmouaWQsIHByb3AsIHZhbHVlIClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0WyBwcm9wIF0gPSB2YWx1ZVxuXG4gICAgICAgIC8vIG11c3QgcmV0dXJuIHRydWUgZm9yIGFueSBFUzYgcHJveHkgc2V0dGVyXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiBwcm94eVxuICB9XG5cbiAgcmV0dXJuIG9ialxufVxuXG5yZXR1cm4gX19wcm94eVxuXG59XG4iLCIvKiBiaWcuanMgdjMuMS4zIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZy5qcy9MSUNFTkNFICovXHJcbjsoZnVuY3Rpb24gKGdsb2JhbCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuLypcclxuICBiaWcuanMgdjMuMS4zXHJcbiAgQSBzbWFsbCwgZmFzdCwgZWFzeS10by11c2UgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBkZWNpbWFsIGFyaXRobWV0aWMuXHJcbiAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnLmpzL1xyXG4gIENvcHlyaWdodCAoYykgMjAxNCBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gIE1JVCBFeHBhdCBMaWNlbmNlXHJcbiovXHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogRURJVEFCTEUgREVGQVVMVFMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuICAgIC8vIFRoZSBkZWZhdWx0IHZhbHVlcyBiZWxvdyBtdXN0IGJlIGludGVnZXJzIHdpdGhpbiB0aGUgc3RhdGVkIHJhbmdlcy5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZSByZXN1bHRzIG9mIG9wZXJhdGlvbnNcclxuICAgICAqIGludm9sdmluZyBkaXZpc2lvbjogZGl2IGFuZCBzcXJ0LCBhbmQgcG93IHdpdGggbmVnYXRpdmUgZXhwb25lbnRzLlxyXG4gICAgICovXHJcbiAgICB2YXIgRFAgPSAyMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWF9EUFxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSByb3VuZGluZyBtb2RlIHVzZWQgd2hlbiByb3VuZGluZyB0byB0aGUgYWJvdmUgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAwIFRvd2FyZHMgemVybyAoaS5lLiB0cnVuY2F0ZSwgbm8gcm91bmRpbmcpLiAgICAgICAoUk9VTkRfRE9XTilcclxuICAgICAgICAgKiAxIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgcm91bmQgdXAuICAoUk9VTkRfSEFMRl9VUClcclxuICAgICAgICAgKiAyIFRvIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG8gZXZlbi4gICAoUk9VTkRfSEFMRl9FVkVOKVxyXG4gICAgICAgICAqIDMgQXdheSBmcm9tIHplcm8uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChST1VORF9VUClcclxuICAgICAgICAgKi9cclxuICAgICAgICBSTSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAsIDEsIDIgb3IgM1xyXG5cclxuICAgICAgICAvLyBUaGUgbWF4aW11bSB2YWx1ZSBvZiBEUCBhbmQgQmlnLkRQLlxyXG4gICAgICAgIE1BWF9EUCA9IDFFNiwgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byAxMDAwMDAwXHJcblxyXG4gICAgICAgIC8vIFRoZSBtYXhpbXVtIG1hZ25pdHVkZSBvZiB0aGUgZXhwb25lbnQgYXJndW1lbnQgdG8gdGhlIHBvdyBtZXRob2QuXHJcbiAgICAgICAgTUFYX1BPV0VSID0gMUU2LCAgICAgICAgICAgICAgICAgICAvLyAxIHRvIDEwMDAwMDBcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbFxyXG4gICAgICAgICAqIG5vdGF0aW9uLlxyXG4gICAgICAgICAqIEphdmFTY3JpcHQncyBOdW1iZXIgdHlwZTogLTdcclxuICAgICAgICAgKiAtMTAwMDAwMCBpcyB0aGUgbWluaW11bSByZWNvbW1lbmRlZCBleHBvbmVudCB2YWx1ZSBvZiBhIEJpZy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBFX05FRyA9IC03LCAgICAgICAgICAgICAgICAgICAvLyAwIHRvIC0xMDAwMDAwXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBhYm92ZSB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsXHJcbiAgICAgICAgICogbm90YXRpb24uXHJcbiAgICAgICAgICogSmF2YVNjcmlwdCdzIE51bWJlciB0eXBlOiAyMVxyXG4gICAgICAgICAqIDEwMDAwMDAgaXMgdGhlIG1heGltdW0gcmVjb21tZW5kZWQgZXhwb25lbnQgdmFsdWUgb2YgYSBCaWcuXHJcbiAgICAgICAgICogKFRoaXMgbGltaXQgaXMgbm90IGVuZm9yY2VkIG9yIGNoZWNrZWQuKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEVfUE9TID0gMjEsICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gMTAwMDAwMFxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAgICAgLy8gVGhlIHNoYXJlZCBwcm90b3R5cGUgb2JqZWN0LlxyXG4gICAgICAgIFAgPSB7fSxcclxuICAgICAgICBpc1ZhbGlkID0gL14tPyhcXGQrKFxcLlxcZCopP3xcXC5cXGQrKShlWystXT9cXGQrKT8kL2ksXHJcbiAgICAgICAgQmlnO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWcgY29uc3RydWN0b3IuXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBiaWdGYWN0b3J5KCkge1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSBCaWcgY29uc3RydWN0b3IgYW5kIGV4cG9ydGVkIGZ1bmN0aW9uLlxyXG4gICAgICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnIG51bWJlciBvYmplY3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ30gQSBudW1lcmljIHZhbHVlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJpZyhuKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciB1c2FnZSB3aXRob3V0IG5ldy5cclxuICAgICAgICAgICAgaWYgKCEoeCBpbnN0YW5jZW9mIEJpZykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuID09PSB2b2lkIDAgPyBiaWdGYWN0b3J5KCkgOiBuZXcgQmlnKG4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGUuXHJcbiAgICAgICAgICAgIGlmIChuIGluc3RhbmNlb2YgQmlnKSB7XHJcbiAgICAgICAgICAgICAgICB4LnMgPSBuLnM7XHJcbiAgICAgICAgICAgICAgICB4LmUgPSBuLmU7XHJcbiAgICAgICAgICAgICAgICB4LmMgPSBuLmMuc2xpY2UoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlKHgsIG4pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBSZXRhaW4gYSByZWZlcmVuY2UgdG8gdGhpcyBCaWcgY29uc3RydWN0b3IsIGFuZCBzaGFkb3dcclxuICAgICAgICAgICAgICogQmlnLnByb3RvdHlwZS5jb25zdHJ1Y3RvciB3aGljaCBwb2ludHMgdG8gT2JqZWN0LlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgeC5jb25zdHJ1Y3RvciA9IEJpZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEJpZy5wcm90b3R5cGUgPSBQO1xyXG4gICAgICAgIEJpZy5EUCA9IERQO1xyXG4gICAgICAgIEJpZy5STSA9IFJNO1xyXG4gICAgICAgIEJpZy5FX05FRyA9IEVfTkVHO1xyXG4gICAgICAgIEJpZy5FX1BPUyA9IEVfUE9TO1xyXG5cclxuICAgICAgICByZXR1cm4gQmlnO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQcml2YXRlIGZ1bmN0aW9uc1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgQmlnIHggaW4gbm9ybWFsIG9yIGV4cG9uZW50aWFsXHJcbiAgICAgKiBub3RhdGlvbiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyBvciBzaWduaWZpY2FudCBkaWdpdHMuXHJcbiAgICAgKlxyXG4gICAgICogeCB7QmlnfSBUaGUgQmlnIHRvIGZvcm1hdC5cclxuICAgICAqIGRwIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqIHRvRSB7bnVtYmVyfSAxICh0b0V4cG9uZW50aWFsKSwgMiAodG9QcmVjaXNpb24pIG9yIHVuZGVmaW5lZCAodG9GaXhlZCkuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvcm1hdCh4LCBkcCwgdG9FKSB7XHJcbiAgICAgICAgdmFyIEJpZyA9IHguY29uc3RydWN0b3IsXHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgaW5kZXggKG5vcm1hbCBub3RhdGlvbikgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgIGkgPSBkcCAtICh4ID0gbmV3IEJpZyh4KSkuZSxcclxuICAgICAgICAgICAgYyA9IHguYztcclxuXHJcbiAgICAgICAgLy8gUm91bmQ/XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID4gKytkcCkge1xyXG4gICAgICAgICAgICBybmQoeCwgaSwgQmlnLlJNKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY1swXSkge1xyXG4gICAgICAgICAgICArK2k7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0b0UpIHtcclxuICAgICAgICAgICAgaSA9IGRwO1xyXG5cclxuICAgICAgICAvLyB0b0ZpeGVkXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYyA9IHguYztcclxuXHJcbiAgICAgICAgICAgIC8vIFJlY2FsY3VsYXRlIGkgYXMgeC5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdmFsdWUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgaSA9IHguZSArIGkgKyAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgIGZvciAoOyBjLmxlbmd0aCA8IGk7IGMucHVzaCgwKSkge1xyXG4gICAgICAgIH1cclxuICAgICAgICBpID0geC5lO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIHRvUHJlY2lzaW9uIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhlIG51bWJlciBvZlxyXG4gICAgICAgICAqIHNpZ25pZmljYW50IGRpZ2l0cyBzcGVjaWZpZWQgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzXHJcbiAgICAgICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBub3JtYWxcclxuICAgICAgICAgKiBub3RhdGlvbi5cclxuICAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4gdG9FID09PSAxIHx8IHRvRSAmJiAoZHAgPD0gaSB8fCBpIDw9IEJpZy5FX05FRykgP1xyXG5cclxuICAgICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAgKHgucyA8IDAgJiYgY1swXSA/ICctJyA6ICcnKSArXHJcbiAgICAgICAgICAgIChjLmxlbmd0aCA+IDEgPyBjWzBdICsgJy4nICsgYy5qb2luKCcnKS5zbGljZSgxKSA6IGNbMF0pICtcclxuICAgICAgICAgICAgICAoaSA8IDAgPyAnZScgOiAnZSsnKSArIGlcclxuXHJcbiAgICAgICAgICAvLyBOb3JtYWwgbm90YXRpb24uXHJcbiAgICAgICAgICA6IHgudG9TdHJpbmcoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFBhcnNlIHRoZSBudW1iZXIgb3Igc3RyaW5nIHZhbHVlIHBhc3NlZCB0byBhIEJpZyBjb25zdHJ1Y3Rvci5cclxuICAgICAqXHJcbiAgICAgKiB4IHtCaWd9IEEgQmlnIG51bWJlciBpbnN0YW5jZS5cclxuICAgICAqIG4ge251bWJlcnxzdHJpbmd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2UoeCwgbikge1xyXG4gICAgICAgIHZhciBlLCBpLCBuTDtcclxuXHJcbiAgICAgICAgLy8gTWludXMgemVybz9cclxuICAgICAgICBpZiAobiA9PT0gMCAmJiAxIC8gbiA8IDApIHtcclxuICAgICAgICAgICAgbiA9ICctMCc7XHJcblxyXG4gICAgICAgIC8vIEVuc3VyZSBuIGlzIHN0cmluZyBhbmQgY2hlY2sgdmFsaWRpdHkuXHJcbiAgICAgICAgfSBlbHNlIGlmICghaXNWYWxpZC50ZXN0KG4gKz0gJycpKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKE5hTik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgc2lnbi5cclxuICAgICAgICB4LnMgPSBuLmNoYXJBdCgwKSA9PSAnLScgPyAobiA9IG4uc2xpY2UoMSksIC0xKSA6IDE7XHJcblxyXG4gICAgICAgIC8vIERlY2ltYWwgcG9pbnQ/XHJcbiAgICAgICAgaWYgKChlID0gbi5pbmRleE9mKCcuJykpID4gLTEpIHtcclxuICAgICAgICAgICAgbiA9IG4ucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIGZvcm0/XHJcbiAgICAgICAgaWYgKChpID0gbi5zZWFyY2goL2UvaSkpID4gMCkge1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgICAgICAgICBpZiAoZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGUgPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUgKz0gK24uc2xpY2UoaSArIDEpO1xyXG4gICAgICAgICAgICBuID0gbi5zdWJzdHJpbmcoMCwgaSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICAgIGUgPSBuLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoaSA9IDA7IG4uY2hhckF0KGkpID09ICcwJzsgaSsrKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaSA9PSAobkwgPSBuLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgIHguYyA9IFsgeC5lID0gMCBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoOyBuLmNoYXJBdCgtLW5MKSA9PSAnMCc7KSB7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHguZSA9IGUgLSBpIC0gMTtcclxuICAgICAgICAgICAgeC5jID0gW107XHJcblxyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHN0cmluZyB0byBhcnJheSBvZiBkaWdpdHMgd2l0aG91dCBsZWFkaW5nL3RyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKGUgPSAwOyBpIDw9IG5MOyB4LmNbZSsrXSA9ICtuLmNoYXJBdChpKyspKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB4O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUm91bmQgQmlnIHggdG8gYSBtYXhpbXVtIG9mIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uXHJcbiAgICAgKiBDYWxsZWQgYnkgZGl2LCBzcXJ0IGFuZCByb3VuZC5cclxuICAgICAqXHJcbiAgICAgKiB4IHtCaWd9IFRoZSBCaWcgdG8gcm91bmQuXHJcbiAgICAgKiBkcCB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKiBybSB7bnVtYmVyfSAwLCAxLCAyIG9yIDMgKERPV04sIEhBTEZfVVAsIEhBTEZfRVZFTiwgVVApXHJcbiAgICAgKiBbbW9yZV0ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlc3VsdCBvZiBkaXZpc2lvbiB3YXMgdHJ1bmNhdGVkLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBybmQoeCwgZHAsIHJtLCBtb3JlKSB7XHJcbiAgICAgICAgdmFyIHUsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICBpID0geC5lICsgZHAgKyAxO1xyXG5cclxuICAgICAgICBpZiAocm0gPT09IDEpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHhjW2ldIGlzIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgbW9yZSA9IHhjW2ldID49IDU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChybSA9PT0gMikge1xyXG4gICAgICAgICAgICBtb3JlID0geGNbaV0gPiA1IHx8IHhjW2ldID09IDUgJiZcclxuICAgICAgICAgICAgICAobW9yZSB8fCBpIDwgMCB8fCB4Y1tpICsgMV0gIT09IHUgfHwgeGNbaSAtIDFdICYgMSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChybSA9PT0gMykge1xyXG4gICAgICAgICAgICBtb3JlID0gbW9yZSB8fCB4Y1tpXSAhPT0gdSB8fCBpIDwgMDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtb3JlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAocm0gIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93RXJyKCchQmlnLlJNIScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaSA8IDEgfHwgIXhjWzBdKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgICB4LmUgPSAtZHA7XHJcbiAgICAgICAgICAgICAgICB4LmMgPSBbMV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYW55IGRpZ2l0cyBhZnRlciB0aGUgcmVxdWlyZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IGktLTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJvdW5kIHVwP1xyXG4gICAgICAgICAgICBpZiAobW9yZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJvdW5kaW5nIHVwIG1heSBtZWFuIHRoZSBwcmV2aW91cyBkaWdpdCBoYXMgdG8gYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgICAgIGZvciAoOyArK3hjW2ldID4gOTspIHtcclxuICAgICAgICAgICAgICAgICAgICB4Y1tpXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsreC5lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Yy51bnNoaWZ0KDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7ICF4Y1stLWldOyB4Yy5wb3AoKSkge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFRocm93IGEgQmlnRXJyb3IuXHJcbiAgICAgKlxyXG4gICAgICogbWVzc2FnZSB7c3RyaW5nfSBUaGUgZXJyb3IgbWVzc2FnZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdGhyb3dFcnIobWVzc2FnZSkge1xyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICAgICAgZXJyLm5hbWUgPSAnQmlnRXJyb3InO1xyXG5cclxuICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFByb3RvdHlwZS9pbnN0YW5jZSBtZXRob2RzXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgICAqL1xyXG4gICAgUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHggPSBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzKTtcclxuICAgICAgICB4LnMgPSAxO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm5cclxuICAgICAqIDEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksXHJcbiAgICAgKiAtMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSwgb3JcclxuICAgICAqIDAgaWYgdGhleSBoYXZlIHRoZSBzYW1lIHZhbHVlLlxyXG4gICAgKi9cclxuICAgIFAuY21wID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICB2YXIgeE5lZyxcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5YyA9ICh5ID0gbmV3IHguY29uc3RydWN0b3IoeSkpLmMsXHJcbiAgICAgICAgICAgIGkgPSB4LnMsXHJcbiAgICAgICAgICAgIGogPSB5LnMsXHJcbiAgICAgICAgICAgIGsgPSB4LmUsXHJcbiAgICAgICAgICAgIGwgPSB5LmU7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAheGNbMF0gPyAheWNbMF0gPyAwIDogLWogOiBpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICAgIGlmIChpICE9IGopIHtcclxuICAgICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHhOZWcgPSBpIDwgMDtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICAgICAgaWYgKGsgIT0gbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gayA+IGwgXiB4TmVnID8gMSA6IC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaSA9IC0xO1xyXG4gICAgICAgIGogPSAoayA9IHhjLmxlbmd0aCkgPCAobCA9IHljLmxlbmd0aCkgPyBrIDogbDtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBmb3IgKDsgKytpIDwgajspIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh4Y1tpXSAhPSB5Y1tpXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHhjW2ldID4geWNbaV0gXiB4TmVnID8gMSA6IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21wYXJlIGxlbmd0aHMuXHJcbiAgICAgICAgcmV0dXJuIGsgPT0gbCA/IDAgOiBrID4gbCBeIHhOZWcgPyAxIDogLTE7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgZGl2aWRlZCBieSB0aGVcclxuICAgICAqIHZhbHVlIG9mIEJpZyB5LCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHRvIGEgbWF4aW11bSBvZiBCaWcuRFAgZGVjaW1hbFxyXG4gICAgICogcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgQmlnLlJNLlxyXG4gICAgICovXHJcbiAgICBQLmRpdiA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICAvLyBkaXZpZGVuZFxyXG4gICAgICAgICAgICBkdmQgPSB4LmMsXHJcbiAgICAgICAgICAgIC8vZGl2aXNvclxyXG4gICAgICAgICAgICBkdnMgPSAoeSA9IG5ldyBCaWcoeSkpLmMsXHJcbiAgICAgICAgICAgIHMgPSB4LnMgPT0geS5zID8gMSA6IC0xLFxyXG4gICAgICAgICAgICBkcCA9IEJpZy5EUDtcclxuXHJcbiAgICAgICAgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIUJpZy5EUCEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciAwP1xyXG4gICAgICAgIGlmICghZHZkWzBdIHx8ICFkdnNbMF0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIGJvdGggYXJlIDAsIHRocm93IE5hTlxyXG4gICAgICAgICAgICBpZiAoZHZkWzBdID09IGR2c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3dFcnIoTmFOKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSWYgZHZzIGlzIDAsIHRocm93ICstSW5maW5pdHkuXHJcbiAgICAgICAgICAgIGlmICghZHZzWzBdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvd0VycihzIC8gMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGR2ZCBpcyAwLCByZXR1cm4gKy0wLlxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyhzICogMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZHZzTCwgZHZzVCwgbmV4dCwgY21wLCByZW1JLCB1LFxyXG4gICAgICAgICAgICBkdnNaID0gZHZzLnNsaWNlKCksXHJcbiAgICAgICAgICAgIGR2ZEkgPSBkdnNMID0gZHZzLmxlbmd0aCxcclxuICAgICAgICAgICAgZHZkTCA9IGR2ZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIC8vIHJlbWFpbmRlclxyXG4gICAgICAgICAgICByZW0gPSBkdmQuc2xpY2UoMCwgZHZzTCksXHJcbiAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoLFxyXG4gICAgICAgICAgICAvLyBxdW90aWVudFxyXG4gICAgICAgICAgICBxID0geSxcclxuICAgICAgICAgICAgcWMgPSBxLmMgPSBbXSxcclxuICAgICAgICAgICAgcWkgPSAwLFxyXG4gICAgICAgICAgICBkaWdpdHMgPSBkcCArIChxLmUgPSB4LmUgLSB5LmUpICsgMTtcclxuXHJcbiAgICAgICAgcS5zID0gcztcclxuICAgICAgICBzID0gZGlnaXRzIDwgMCA/IDAgOiBkaWdpdHM7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB2ZXJzaW9uIG9mIGRpdmlzb3Igd2l0aCBsZWFkaW5nIHplcm8uXHJcbiAgICAgICAgZHZzWi51bnNoaWZ0KDApO1xyXG5cclxuICAgICAgICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gICAgICAgIGZvciAoOyByZW1MKysgPCBkdnNMOyByZW0ucHVzaCgwKSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG8ge1xyXG5cclxuICAgICAgICAgICAgLy8gJ25leHQnIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgZm9yIChuZXh0ID0gMDsgbmV4dCA8IDEwOyBuZXh0KyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIGlmIChkdnNMICE9IChyZW1MID0gcmVtLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbXAgPSBkdnNMID4gcmVtTCA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAocmVtSSA9IC0xLCBjbXAgPSAwOyArK3JlbUkgPCBkdnNMOykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGR2c1tyZW1JXSAhPSByZW1bcmVtSV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IGR2c1tyZW1JXSA+IHJlbVtyZW1JXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIGRpdmlzb3IgPCByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1haW5kZXIgY2FuJ3QgYmUgbW9yZSB0aGFuIDEgZGlnaXQgbG9uZ2VyIHRoYW4gZGl2aXNvci5cclxuICAgICAgICAgICAgICAgICAgICAvLyBFcXVhbGlzZSBsZW5ndGhzIHVzaW5nIGRpdmlzb3Igd2l0aCBleHRyYSBsZWFkaW5nIHplcm8/XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChkdnNUID0gcmVtTCA9PSBkdnNMID8gZHZzIDogZHZzWjsgcmVtTDspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZW1bLS1yZW1MXSA8IGR2c1RbcmVtTF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbUkgPSByZW1MO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoOyByZW1JICYmICFyZW1bLS1yZW1JXTsgcmVtW3JlbUldID0gOSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLS1yZW1bcmVtSV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1bcmVtTF0gKz0gMTA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtW3JlbUxdIC09IGR2c1RbcmVtTF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyAhcmVtWzBdOyByZW0uc2hpZnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgJ25leHQnIGRpZ2l0IHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHFjW3FpKytdID0gY21wID8gbmV4dCA6ICsrbmV4dDtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAocmVtWzBdICYmIGNtcCkge1xyXG4gICAgICAgICAgICAgICAgcmVtW3JlbUxdID0gZHZkW2R2ZEldIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZW0gPSBbIGR2ZFtkdmRJXSBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gd2hpbGUgKChkdmRJKysgPCBkdmRMIHx8IHJlbVswXSAhPT0gdSkgJiYgcy0tKTtcclxuXHJcbiAgICAgICAgLy8gTGVhZGluZyB6ZXJvPyBEbyBub3QgcmVtb3ZlIGlmIHJlc3VsdCBpcyBzaW1wbHkgemVybyAocWkgPT0gMSkuXHJcbiAgICAgICAgaWYgKCFxY1swXSAmJiBxaSAhPSAxKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGVyZSBjYW4ndCBiZSBtb3JlIHRoYW4gb25lIHplcm8uXHJcbiAgICAgICAgICAgIHFjLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHEuZS0tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUm91bmQ/XHJcbiAgICAgICAgaWYgKHFpID4gZGlnaXRzKSB7XHJcbiAgICAgICAgICAgIHJuZChxLCBkcCwgQmlnLlJNLCByZW1bMF0gIT09IHUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHE7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWcgeSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmVxID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuY21wKHkpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuZ3QgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA+IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGVcclxuICAgICAqIHZhbHVlIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5ndGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA+IC0xO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAubHQgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNtcCh5KSA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZyB5LCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5sdGUgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgICByZXR1cm4gdGhpcy5jbXAoeSkgPCAxO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIG1pbnVzIHRoZSB2YWx1ZVxyXG4gICAgICogb2YgQmlnIHkuXHJcbiAgICAgKi9cclxuICAgIFAuc3ViID0gUC5taW51cyA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICBhID0geC5zLFxyXG4gICAgICAgICAgICBiID0gKHkgPSBuZXcgQmlnKHkpKS5zO1xyXG5cclxuICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4YyA9IHguYy5zbGljZSgpLFxyXG4gICAgICAgICAgICB4ZSA9IHguZSxcclxuICAgICAgICAgICAgeWMgPSB5LmMsXHJcbiAgICAgICAgICAgIHllID0geS5lO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgLy8geSBpcyBub24temVybz8geCBpcyBub24temVybz8gT3IgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgICAgcmV0dXJuIHljWzBdID8gKHkucyA9IC1iLCB5KSA6IG5ldyBCaWcoeGNbMF0gPyB4IDogMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoeExUeSA9IGEgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgZm9yIChiID0gYTsgYi0tOyB0LnB1c2goMCkpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICAgICAgaiA9ICgoeExUeSA9IHhjLmxlbmd0aCA8IHljLmxlbmd0aCkgPyB4YyA6IHljKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGEgPSBiID0gMDsgYiA8IGo7IGIrKykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh4Y1tiXSAhPSB5Y1tiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB4IDwgeT8gUG9pbnQgeGMgdG8gdGhlIGFycmF5IG9mIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICAgIGlmICh4TFR5KSB7XHJcbiAgICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICAgICAgeGMgPSB5YztcclxuICAgICAgICAgICAgeWMgPSB0O1xyXG4gICAgICAgICAgICB5LnMgPSAteS5zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci4gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlclxyXG4gICAgICAgICAqIGFzIHN1YnRyYWN0aW9uIG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmICgoIGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCkgKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBiLS07IHhjW2krK10gPSAwKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgICAgZm9yIChiID0gaTsgaiA+IGE7KXtcclxuXHJcbiAgICAgICAgICAgIGlmICh4Y1stLWpdIDwgeWNbal0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IDkpIHtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICAgICAgICB4Y1tqXSArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKDsgeGNbLS1iXSA9PT0gMDsgeGMucG9wKCkpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgZm9yICg7IHhjWzBdID09PSAwOykge1xyXG4gICAgICAgICAgICB4Yy5zaGlmdCgpO1xyXG4gICAgICAgICAgICAtLXllO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF4Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgLy8gbiAtIG4gPSArMFxyXG4gICAgICAgICAgICB5LnMgPSAxO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVzdWx0IG11c3QgYmUgemVyby5cclxuICAgICAgICAgICAgeGMgPSBbeWUgPSAwXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHkuYyA9IHhjO1xyXG4gICAgICAgIHkuZSA9IHllO1xyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtb2R1bG8gdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiBCaWcgeS5cclxuICAgICAqL1xyXG4gICAgUC5tb2QgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHZhciB5R1R4LFxyXG4gICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgYSA9IHgucyxcclxuICAgICAgICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAgICAgaWYgKCF5LmNbMF0pIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoTmFOKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHgucyA9IHkucyA9IDE7XHJcbiAgICAgICAgeUdUeCA9IHkuY21wKHgpID09IDE7XHJcbiAgICAgICAgeC5zID0gYTtcclxuICAgICAgICB5LnMgPSBiO1xyXG5cclxuICAgICAgICBpZiAoeUdUeCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyh4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGEgPSBCaWcuRFA7XHJcbiAgICAgICAgYiA9IEJpZy5STTtcclxuICAgICAgICBCaWcuRFAgPSBCaWcuUk0gPSAwO1xyXG4gICAgICAgIHggPSB4LmRpdih5KTtcclxuICAgICAgICBCaWcuRFAgPSBhO1xyXG4gICAgICAgIEJpZy5STSA9IGI7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm1pbnVzKCB4LnRpbWVzKHkpICk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcGx1cyB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZyB5LlxyXG4gICAgICovXHJcbiAgICBQLmFkZCA9IFAucGx1cyA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIHQsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICBhID0geC5zLFxyXG4gICAgICAgICAgICBiID0gKHkgPSBuZXcgQmlnKHkpKS5zO1xyXG5cclxuICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgeGUgPSB4LmUsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5ZSA9IHkuZSxcclxuICAgICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgICAvLyB5IGlzIG5vbi16ZXJvPyB4IGlzIG5vbi16ZXJvPyBPciBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgICAgICByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZyh4Y1swXSA/IHggOiBhICogMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgLy8gTm90ZTogRmFzdGVyIHRvIHVzZSByZXZlcnNlIHRoZW4gZG8gdW5zaGlmdHMuXHJcbiAgICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgYS0tOyB0LnB1c2goMCkpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFBvaW50IHhjIHRvIHRoZSBsb25nZXIgYXJyYXkuXHJcbiAgICAgICAgaWYgKHhjLmxlbmd0aCAtIHljLmxlbmd0aCA8IDApIHtcclxuICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICB5YyA9IHhjO1xyXG4gICAgICAgICAgICB4YyA9IHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGEgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogT25seSBzdGFydCBhZGRpbmcgYXQgeWMubGVuZ3RoIC0gMSBhcyB0aGUgZnVydGhlciBkaWdpdHMgb2YgeGMgY2FuIGJlXHJcbiAgICAgICAgICogbGVmdCBhcyB0aGV5IGFyZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmb3IgKGIgPSAwOyBhOykge1xyXG4gICAgICAgICAgICBiID0gKHhjWy0tYV0gPSB4Y1thXSArIHljW2FdICsgYikgLyAxMCB8IDA7XHJcbiAgICAgICAgICAgIHhjW2FdICU9IDEwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG5cclxuICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICB4Yy51bnNoaWZ0KGIpO1xyXG4gICAgICAgICAgICArK3llO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGEgPSB4Yy5sZW5ndGg7IHhjWy0tYV0gPT09IDA7IHhjLnBvcCgpKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB5LmMgPSB4YztcclxuICAgICAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyByYWlzZWQgdG8gdGhlIHBvd2VyIG4uXHJcbiAgICAgKiBJZiBuIGlzIG5lZ2F0aXZlLCByb3VuZCwgaWYgbmVjZXNzYXJ5LCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWxcclxuICAgICAqIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgICAqXHJcbiAgICAgKiBuIHtudW1iZXJ9IEludGVnZXIsIC1NQVhfUE9XRVIgdG8gTUFYX1BPV0VSIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC5wb3cgPSBmdW5jdGlvbiAobikge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgICAgICAgb25lID0gbmV3IHguY29uc3RydWN0b3IoMSksXHJcbiAgICAgICAgICAgIHkgPSBvbmUsXHJcbiAgICAgICAgICAgIGlzTmVnID0gbiA8IDA7XHJcblxyXG4gICAgICAgIGlmIChuICE9PSB+fm4gfHwgbiA8IC1NQVhfUE9XRVIgfHwgbiA+IE1BWF9QT1dFUikge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXBvdyEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG4gPSBpc05lZyA/IC1uIDogbjtcclxuXHJcbiAgICAgICAgZm9yICg7Oykge1xyXG5cclxuICAgICAgICAgICAgaWYgKG4gJiAxKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0geS50aW1lcyh4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuID4+PSAxO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFuKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB4ID0geC50aW1lcyh4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpc05lZyA/IG9uZS5kaXYoeSkgOiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gYVxyXG4gICAgICogbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gICAgICogSWYgZHAgaXMgbm90IHNwZWNpZmllZCwgcm91bmQgdG8gMCBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAqIElmIHJtIGlzIG5vdCBzcGVjaWZpZWQsIHVzZSBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIDAsIDEsIDIgb3IgMyAoUk9VTkRfRE9XTiwgUk9VTkRfSEFMRl9VUCwgUk9VTkRfSEFMRl9FVkVOLCBST1VORF9VUClcclxuICAgICAqL1xyXG4gICAgUC5yb3VuZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3I7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGRwID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXJvdW5kIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBybmQoeCA9IG5ldyBCaWcoeCksIGRwLCBybSA9PSBudWxsID8gQmlnLlJNIDogcm0pO1xyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcsXHJcbiAgICAgKiByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHRvIGEgbWF4aW11bSBvZiBCaWcuRFAgZGVjaW1hbCBwbGFjZXMgdXNpbmdcclxuICAgICAqIHJvdW5kaW5nIG1vZGUgQmlnLlJNLlxyXG4gICAgICovXHJcbiAgICBQLnNxcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVzdGltYXRlLCByLCBhcHByb3gsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgaSA9IHgucyxcclxuICAgICAgICAgICAgZSA9IHguZSxcclxuICAgICAgICAgICAgaGFsZiA9IG5ldyBCaWcoJzAuNScpO1xyXG5cclxuICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWcoeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBuZWdhdGl2ZSwgdGhyb3cgTmFOLlxyXG4gICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycihOYU4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXN0aW1hdGUuXHJcbiAgICAgICAgaSA9IE1hdGguc3FydCh4LnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIHJlc3VsdCBleHBvbmVudC5cclxuICAgICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSAxIC8gMCkge1xyXG4gICAgICAgICAgICBlc3RpbWF0ZSA9IHhjLmpvaW4oJycpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEoZXN0aW1hdGUubGVuZ3RoICsgZSAmIDEpKSB7XHJcbiAgICAgICAgICAgICAgICBlc3RpbWF0ZSArPSAnMCc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHIgPSBuZXcgQmlnKCBNYXRoLnNxcnQoZXN0aW1hdGUpLnRvU3RyaW5nKCkgKTtcclxuICAgICAgICAgICAgci5lID0gKChlICsgMSkgLyAyIHwgMCkgLSAoZSA8IDAgfHwgZSAmIDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHIgPSBuZXcgQmlnKGkudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpID0gci5lICsgKEJpZy5EUCArPSA0KTtcclxuXHJcbiAgICAgICAgLy8gTmV3dG9uLVJhcGhzb24gaXRlcmF0aW9uLlxyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgYXBwcm94ID0gcjtcclxuICAgICAgICAgICAgciA9IGhhbGYudGltZXMoIGFwcHJveC5wbHVzKCB4LmRpdihhcHByb3gpICkgKTtcclxuICAgICAgICB9IHdoaWxlICggYXBwcm94LmMuc2xpY2UoMCwgaSkuam9pbignJykgIT09XHJcbiAgICAgICAgICAgICAgICAgICAgICAgci5jLnNsaWNlKDAsIGkpLmpvaW4oJycpICk7XHJcblxyXG4gICAgICAgIHJuZChyLCBCaWcuRFAgLT0gNCwgQmlnLlJNKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgdGltZXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWcgeS5cclxuICAgICAqL1xyXG4gICAgUC5tdWwgPSBQLnRpbWVzID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICB2YXIgYyxcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5YyA9ICh5ID0gbmV3IEJpZyh5KSkuYyxcclxuICAgICAgICAgICAgYSA9IHhjLmxlbmd0aCxcclxuICAgICAgICAgICAgYiA9IHljLmxlbmd0aCxcclxuICAgICAgICAgICAgaSA9IHguZSxcclxuICAgICAgICAgICAgaiA9IHkuZTtcclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHNpZ24gb2YgcmVzdWx0LlxyXG4gICAgICAgIHkucyA9IHgucyA9PSB5LnMgPyAxIDogLTE7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBzaWduZWQgMCBpZiBlaXRoZXIgMC5cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJpZyh5LnMgKiAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpc2UgZXhwb25lbnQgb2YgcmVzdWx0IGFzIHguZSArIHkuZS5cclxuICAgICAgICB5LmUgPSBpICsgajtcclxuXHJcbiAgICAgICAgLy8gSWYgYXJyYXkgeGMgaGFzIGZld2VyIGRpZ2l0cyB0aGFuIHljLCBzd2FwIHhjIGFuZCB5YywgYW5kIGxlbmd0aHMuXHJcbiAgICAgICAgaWYgKGEgPCBiKSB7XHJcbiAgICAgICAgICAgIGMgPSB4YztcclxuICAgICAgICAgICAgeGMgPSB5YztcclxuICAgICAgICAgICAgeWMgPSBjO1xyXG4gICAgICAgICAgICBqID0gYTtcclxuICAgICAgICAgICAgYSA9IGI7XHJcbiAgICAgICAgICAgIGIgPSBqO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSW5pdGlhbGlzZSBjb2VmZmljaWVudCBhcnJheSBvZiByZXN1bHQgd2l0aCB6ZXJvcy5cclxuICAgICAgICBmb3IgKGMgPSBuZXcgQXJyYXkoaiA9IGEgKyBiKTsgai0tOyBjW2pdID0gMCkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTXVsdGlwbHkuXHJcblxyXG4gICAgICAgIC8vIGkgaXMgaW5pdGlhbGx5IHhjLmxlbmd0aC5cclxuICAgICAgICBmb3IgKGkgPSBiOyBpLS07KSB7XHJcbiAgICAgICAgICAgIGIgPSAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYSBpcyB5Yy5sZW5ndGguXHJcbiAgICAgICAgICAgIGZvciAoaiA9IGEgKyBpOyBqID4gaTspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDdXJyZW50IHN1bSBvZiBwcm9kdWN0cyBhdCB0aGlzIGRpZ2l0IHBvc2l0aW9uLCBwbHVzIGNhcnJ5LlxyXG4gICAgICAgICAgICAgICAgYiA9IGNbal0gKyB5Y1tpXSAqIHhjW2ogLSBpIC0gMV0gKyBiO1xyXG4gICAgICAgICAgICAgICAgY1tqLS1dID0gYiAlIDEwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNhcnJ5XHJcbiAgICAgICAgICAgICAgICBiID0gYiAvIDEwIHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjW2pdID0gKGNbal0gKyBiKSAlIDEwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSW5jcmVtZW50IHJlc3VsdCBleHBvbmVudCBpZiB0aGVyZSBpcyBhIGZpbmFsIGNhcnJ5LlxyXG4gICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICsreS5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFueSBsZWFkaW5nIHplcm8uXHJcbiAgICAgICAgaWYgKCFjWzBdKSB7XHJcbiAgICAgICAgICAgIGMuc2hpZnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGkgPSBjLmxlbmd0aDsgIWNbLS1pXTsgYy5wb3AoKSkge1xyXG4gICAgICAgIH1cclxuICAgICAgICB5LmMgPSBjO1xyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZy5cclxuICAgICAqIFJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGlzIEJpZyBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudCBlcXVhbCB0b1xyXG4gICAgICogb3IgZ3JlYXRlciB0aGFuIEJpZy5FX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAqIEJpZy5FX05FRy5cclxuICAgICAqL1xyXG4gICAgUC50b1N0cmluZyA9IFAudmFsdWVPZiA9IFAudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgZSA9IHguZSxcclxuICAgICAgICAgICAgc3RyID0geC5jLmpvaW4oJycpLFxyXG4gICAgICAgICAgICBzdHJMID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24/XHJcbiAgICAgICAgaWYgKGUgPD0gQmlnLkVfTkVHIHx8IGUgPj0gQmlnLkVfUE9TKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IHN0ci5jaGFyQXQoMCkgKyAoc3RyTCA+IDEgPyAnLicgKyBzdHIuc2xpY2UoMSkgOiAnJykgK1xyXG4gICAgICAgICAgICAgIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuXHJcbiAgICAgICAgLy8gTmVnYXRpdmUgZXhwb25lbnQ/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yICg7ICsrZTsgc3RyID0gJzAnICsgc3RyKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RyID0gJzAuJyArIHN0cjtcclxuXHJcbiAgICAgICAgLy8gUG9zaXRpdmUgZXhwb25lbnQ/XHJcbiAgICAgICAgfSBlbHNlIGlmIChlID4gMCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCsrZSA+IHN0ckwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGUgLT0gc3RyTDsgZS0tIDsgc3RyICs9ICcwJykge1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGUgPCBzdHJMKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMCwgZSkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnQgemVyby5cclxuICAgICAgICB9IGVsc2UgaWYgKHN0ckwgPiAxKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IHN0ci5jaGFyQXQoMCkgKyAnLicgKyBzdHIuc2xpY2UoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBdm9pZCAnLTAnXHJcbiAgICAgICAgcmV0dXJuIHgucyA8IDAgJiYgeC5jWzBdID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAqIElmIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvUHJlY2lzaW9uIGFuZCBmb3JtYXQgYXJlIG5vdCByZXF1aXJlZCB0aGV5XHJcbiAgICAgKiBjYW4gc2FmZWx5IGJlIGNvbW1lbnRlZC1vdXQgb3IgZGVsZXRlZC4gTm8gcmVkdW5kYW50IGNvZGUgd2lsbCBiZSBsZWZ0LlxyXG4gICAgICogZm9ybWF0IGlzIHVzZWQgb25seSBieSB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkIGFuZCB0b1ByZWNpc2lvbi5cclxuICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaW4gZXhwb25lbnRpYWxcclxuICAgICAqIG5vdGF0aW9uIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIGFuZCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHVzaW5nXHJcbiAgICAgKiBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9FeHBvbmVudGlhbCA9IGZ1bmN0aW9uIChkcCkge1xyXG5cclxuICAgICAgICBpZiAoZHAgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBkcCA9IHRoaXMuYy5sZW5ndGggLSAxO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZHAgIT09IH5+ZHAgfHwgZHAgPCAwIHx8IGRwID4gTUFYX0RQKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKCchdG9FeHAhJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCAxKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpbiBub3JtYWwgbm90YXRpb25cclxuICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIGFuZCByb3VuZGVkLCBpZiBuZWNlc3NhcnksIHVzaW5nIEJpZy5STS5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKGRwKSB7XHJcbiAgICAgICAgdmFyIHN0cixcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIG5lZyA9IEJpZy5FX05FRyxcclxuICAgICAgICAgICAgcG9zID0gQmlnLkVfUE9TO1xyXG5cclxuICAgICAgICAvLyBQcmV2ZW50IHRoZSBwb3NzaWJpbGl0eSBvZiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICBCaWcuRV9ORUcgPSAtKEJpZy5FX1BPUyA9IDEgLyAwKTtcclxuXHJcbiAgICAgICAgaWYgKGRwID09IG51bGwpIHtcclxuICAgICAgICAgICAgc3RyID0geC50b1N0cmluZygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZHAgPT09IH5+ZHAgJiYgZHAgPj0gMCAmJiBkcCA8PSBNQVhfRFApIHtcclxuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHgsIHguZSArIGRwKTtcclxuXHJcbiAgICAgICAgICAgIC8vICgtMCkudG9GaXhlZCgpIGlzICcwJywgYnV0ICgtMC4xKS50b0ZpeGVkKCkgaXMgJy0wJy5cclxuICAgICAgICAgICAgLy8gKC0wKS50b0ZpeGVkKDEpIGlzICcwLjAnLCBidXQgKC0wLjAxKS50b0ZpeGVkKDEpIGlzICctMC4wJy5cclxuICAgICAgICAgICAgaWYgKHgucyA8IDAgJiYgeC5jWzBdICYmIHN0ci5pbmRleE9mKCctJykgPCAwKSB7XHJcbiAgICAgICAgLy9FLmcuIC0wLjUgaWYgcm91bmRlZCB0byAtMCB3aWxsIGNhdXNlIHRvU3RyaW5nIHRvIG9taXQgdGhlIG1pbnVzIHNpZ24uXHJcbiAgICAgICAgICAgICAgICBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgQmlnLkVfTkVHID0gbmVnO1xyXG4gICAgICAgIEJpZy5FX1BPUyA9IHBvcztcclxuXHJcbiAgICAgICAgaWYgKCFzdHIpIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoJyF0b0ZpeCEnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcm91bmRlZCB0byBzZFxyXG4gICAgICogc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIEJpZy5STS4gVXNlIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHNkIGlzIGxlc3NcclxuICAgICAqIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHMgbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZVxyXG4gICAgICogdmFsdWUgaW4gbm9ybWFsIG5vdGF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIHNkIHtudW1iZXJ9IEludGVnZXIsIDEgdG8gTUFYX0RQIGluY2x1c2l2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b1ByZWNpc2lvbiA9IGZ1bmN0aW9uIChzZCkge1xyXG5cclxuICAgICAgICBpZiAoc2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2QgIT09IH5+c2QgfHwgc2QgPCAxIHx8IHNkID4gTUFYX0RQKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKCchdG9QcmUhJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIHNkIC0gMSwgMik7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLyBFeHBvcnRcclxuXHJcblxyXG4gICAgQmlnID0gYmlnRmFjdG9yeSgpO1xyXG5cclxuICAgIC8vQU1ELlxyXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBCaWc7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gTm9kZSBhbmQgb3RoZXIgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gQmlnO1xyXG5cclxuICAgIC8vQnJvd3Nlci5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZ2xvYmFsLkJpZyA9IEJpZztcclxuICAgIH1cclxufSkodGhpcyk7XHJcbiIsIi8qXG5Db3B5cmlnaHQgKGMpIDIwMTQsIFlhaG9vISBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5Db3B5cmlnaHRzIGxpY2Vuc2VkIHVuZGVyIHRoZSBOZXcgQlNEIExpY2Vuc2UuXG5TZWUgdGhlIGFjY29tcGFueWluZyBMSUNFTlNFIGZpbGUgZm9yIHRlcm1zLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBHZW5lcmF0ZSBhbiBpbnRlcm5hbCBVSUQgdG8gbWFrZSB0aGUgcmVnZXhwIHBhdHRlcm4gaGFyZGVyIHRvIGd1ZXNzLlxudmFyIFVJRCAgICAgICAgICAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDAwKS50b1N0cmluZygxNik7XG52YXIgUExBQ0VfSE9MREVSX1JFR0VYUCA9IG5ldyBSZWdFeHAoJ1wiQF9fKEZ8UnxEKS0nICsgVUlEICsgJy0oXFxcXGQrKV9fQFwiJywgJ2cnKTtcblxudmFyIElTX05BVElWRV9DT0RFX1JFR0VYUCA9IC9cXHtcXHMqXFxbbmF0aXZlIGNvZGVcXF1cXHMqXFx9L2c7XG52YXIgVU5TQUZFX0NIQVJTX1JFR0VYUCAgID0gL1s8PlxcL1xcdTIwMjhcXHUyMDI5XS9nO1xuXG4vLyBNYXBwaW5nIG9mIHVuc2FmZSBIVE1MIGFuZCBpbnZhbGlkIEphdmFTY3JpcHQgbGluZSB0ZXJtaW5hdG9yIGNoYXJzIHRvIHRoZWlyXG4vLyBVbmljb2RlIGNoYXIgY291bnRlcnBhcnRzIHdoaWNoIGFyZSBzYWZlIHRvIHVzZSBpbiBKYXZhU2NyaXB0IHN0cmluZ3MuXG52YXIgRVNDQVBFRF9DSEFSUyA9IHtcbiAgICAnPCcgICAgIDogJ1xcXFx1MDAzQycsXG4gICAgJz4nICAgICA6ICdcXFxcdTAwM0UnLFxuICAgICcvJyAgICAgOiAnXFxcXHUwMDJGJyxcbiAgICAnXFx1MjAyOCc6ICdcXFxcdTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ1xcXFx1MjAyOSdcbn07XG5cbmZ1bmN0aW9uIGVzY2FwZVVuc2FmZUNoYXJzKHVuc2FmZUNoYXIpIHtcbiAgICByZXR1cm4gRVNDQVBFRF9DSEFSU1t1bnNhZmVDaGFyXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzZXJpYWxpemUob2JqLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIC8vIEJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBgc3BhY2VgIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnbnVtYmVyJyB8fCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtzcGFjZTogb3B0aW9uc307XG4gICAgfVxuXG4gICAgdmFyIGZ1bmN0aW9ucyA9IFtdO1xuICAgIHZhciByZWdleHBzICAgPSBbXTtcbiAgICB2YXIgZGF0ZXMgICAgID0gW107XG5cbiAgICAvLyBSZXR1cm5zIHBsYWNlaG9sZGVycyBmb3IgZnVuY3Rpb25zIGFuZCByZWdleHBzIChpZGVudGlmaWVkIGJ5IGluZGV4KVxuICAgIC8vIHdoaWNoIGFyZSBsYXRlciByZXBsYWNlZCBieSB0aGVpciBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAgZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gb2JqZWN0IHcvIGEgdG9KU09OIG1ldGhvZCwgdG9KU09OIGlzIGNhbGxlZCBiZWZvcmVcbiAgICAgICAgLy8gdGhlIHJlcGxhY2VyIHJ1bnMsIHNvIHdlIHVzZSB0aGlzW2tleV0gdG8gZ2V0IHRoZSBub24tdG9KU09OZWQgdmFsdWUuXG4gICAgICAgIHZhciBvcmlnVmFsdWUgPSB0aGlzW2tleV07XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9yaWdWYWx1ZTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmKG9yaWdWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQF9fUi0nICsgVUlEICsgJy0nICsgKHJlZ2V4cHMucHVzaChvcmlnVmFsdWUpIC0gMSkgKyAnX19AJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYob3JpZ1ZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnQF9fRC0nICsgVUlEICsgJy0nICsgKGRhdGVzLnB1c2gob3JpZ1ZhbHVlKSAtIDEpICsgJ19fQCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuICdAX19GLScgKyBVSUQgKyAnLScgKyAoZnVuY3Rpb25zLnB1c2gob3JpZ1ZhbHVlKSAtIDEpICsgJ19fQCc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgdmFyIHN0cjtcblxuICAgIC8vIENyZWF0ZXMgYSBKU09OIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmFsdWUuXG4gICAgLy8gTk9URTogTm9kZSAwLjEyIGdvZXMgaW50byBzbG93IG1vZGUgd2l0aCBleHRyYSBKU09OLnN0cmluZ2lmeSgpIGFyZ3MuXG4gICAgaWYgKG9wdGlvbnMuaXNKU09OICYmICFvcHRpb25zLnNwYWNlKSB7XG4gICAgICAgIHN0ciA9IEpTT04uc3RyaW5naWZ5KG9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gSlNPTi5zdHJpbmdpZnkob2JqLCBvcHRpb25zLmlzSlNPTiA/IG51bGwgOiByZXBsYWNlciwgb3B0aW9ucy5zcGFjZSk7XG4gICAgfVxuXG4gICAgLy8gUHJvdGVjdHMgYWdhaW5zdCBgSlNPTi5zdHJpbmdpZnkoKWAgcmV0dXJuaW5nIGB1bmRlZmluZWRgLCBieSBzZXJpYWxpemluZ1xuICAgIC8vIHRvIHRoZSBsaXRlcmFsIHN0cmluZzogXCJ1bmRlZmluZWRcIi5cbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZyhzdHIpO1xuICAgIH1cblxuICAgIC8vIFJlcGxhY2UgdW5zYWZlIEhUTUwgYW5kIGludmFsaWQgSmF2YVNjcmlwdCBsaW5lIHRlcm1pbmF0b3IgY2hhcnMgd2l0aFxuICAgIC8vIHRoZWlyIHNhZmUgVW5pY29kZSBjaGFyIGNvdW50ZXJwYXJ0LiBUaGlzIF9tdXN0XyBoYXBwZW4gYmVmb3JlIHRoZVxuICAgIC8vIHJlZ2V4cHMgYW5kIGZ1bmN0aW9ucyBhcmUgc2VyaWFsaXplZCBhbmQgYWRkZWQgYmFjayB0byB0aGUgc3RyaW5nLlxuICAgIGlmIChvcHRpb25zLnVuc2FmZSAhPT0gdHJ1ZSkge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShVTlNBRkVfQ0hBUlNfUkVHRVhQLCBlc2NhcGVVbnNhZmVDaGFycyk7XG4gICAgfVxuXG4gICAgaWYgKGZ1bmN0aW9ucy5sZW5ndGggPT09IDAgJiYgcmVnZXhwcy5sZW5ndGggPT09IDAgJiYgZGF0ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgLy8gUmVwbGFjZXMgYWxsIG9jY3VycmVuY2VzIG9mIGZ1bmN0aW9uLCByZWdleHAgYW5kIGRhdGUgcGxhY2Vob2xkZXJzIGluIHRoZVxuICAgIC8vIEpTT04gc3RyaW5nIHdpdGggdGhlaXIgc3RyaW5nIHJlcHJlc2VudGF0aW9ucy4gSWYgdGhlIG9yaWdpbmFsIHZhbHVlIGNhblxuICAgIC8vIG5vdCBiZSBmb3VuZCwgdGhlbiBgdW5kZWZpbmVkYCBpcyB1c2VkLlxuICAgIHJldHVybiBzdHIucmVwbGFjZShQTEFDRV9IT0xERVJfUkVHRVhQLCBmdW5jdGlvbiAobWF0Y2gsIHR5cGUsIHZhbHVlSW5kZXgpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdEJykge1xuICAgICAgICAgICAgcmV0dXJuIFwibmV3IERhdGUoXFxcIlwiICsgZGF0ZXNbdmFsdWVJbmRleF0udG9JU09TdHJpbmcoKSArIFwiXFxcIilcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSAnUicpIHtcbiAgICAgICAgICAgIHJldHVybiByZWdleHBzW3ZhbHVlSW5kZXhdLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZm4gICAgICAgICAgID0gZnVuY3Rpb25zW3ZhbHVlSW5kZXhdO1xuICAgICAgICB2YXIgc2VyaWFsaXplZEZuID0gZm4udG9TdHJpbmcoKTtcblxuICAgICAgICBpZiAoSVNfTkFUSVZFX0NPREVfUkVHRVhQLnRlc3Qoc2VyaWFsaXplZEZuKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU2VyaWFsaXppbmcgbmF0aXZlIGZ1bmN0aW9uOiAnICsgZm4ubmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VyaWFsaXplZEZuO1xuICAgIH0pO1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmxldCBNZW1vcnlIZWxwZXIgPSB7XG4gIGNyZWF0ZSggc2l6ZU9yQnVmZmVyPTQwOTYsIG1lbXR5cGU9RmxvYXQzMkFycmF5ICkge1xuICAgIGxldCBoZWxwZXIgPSBPYmplY3QuY3JlYXRlKCB0aGlzIClcblxuICAgIC8vIGNvbnZlbmllbnRseSwgYnVmZmVyIGNvbnN0cnVjdG9ycyBhY2NlcHQgZWl0aGVyIGEgc2l6ZSBvciBhbiBhcnJheSBidWZmZXIgdG8gdXNlLi4uXG4gICAgLy8gc28sIG5vIG1hdHRlciB3aGljaCBpcyBwYXNzZWQgdG8gc2l6ZU9yQnVmZmVyIGl0IHNob3VsZCB3b3JrLlxuICAgIE9iamVjdC5hc3NpZ24oIGhlbHBlciwge1xuICAgICAgaGVhcDogbmV3IG1lbXR5cGUoIHNpemVPckJ1ZmZlciApLFxuICAgICAgbGlzdDoge30sXG4gICAgICBmcmVlTGlzdDoge31cbiAgICB9KVxuXG4gICAgcmV0dXJuIGhlbHBlclxuICB9LFxuXG4gIGFsbG9jKCBzaXplLCBpbW11dGFibGUgKSB7XG4gICAgbGV0IGlkeCA9IC0xXG5cbiAgICBpZiggc2l6ZSA+IHRoaXMuaGVhcC5sZW5ndGggKSB7XG4gICAgICB0aHJvdyBFcnJvciggJ0FsbG9jYXRpb24gcmVxdWVzdCBpcyBsYXJnZXIgdGhhbiBoZWFwIHNpemUgb2YgJyArIHRoaXMuaGVhcC5sZW5ndGggKVxuICAgIH1cblxuICAgIGZvciggbGV0IGtleSBpbiB0aGlzLmZyZWVMaXN0ICkge1xuICAgICAgbGV0IGNhbmRpZGF0ZSA9IHRoaXMuZnJlZUxpc3RbIGtleSBdXG5cbiAgICAgIGlmKCBjYW5kaWRhdGUuc2l6ZSA+PSBzaXplICkge1xuICAgICAgICBpZHggPSBrZXlcblxuICAgICAgICB0aGlzLmxpc3RbIGlkeCBdID0geyBzaXplLCBpbW11dGFibGUsIHJlZmVyZW5jZXM6MSB9XG5cbiAgICAgICAgaWYoIGNhbmRpZGF0ZS5zaXplICE9PSBzaXplICkge1xuICAgICAgICAgIGxldCBuZXdJbmRleCA9IGlkeCArIHNpemUsXG4gICAgICAgICAgICAgIG5ld0ZyZWVTaXplXG5cbiAgICAgICAgICBmb3IoIGxldCBrZXkgaW4gdGhpcy5saXN0ICkge1xuICAgICAgICAgICAgaWYoIGtleSA+IG5ld0luZGV4ICkge1xuICAgICAgICAgICAgICBuZXdGcmVlU2l6ZSA9IGtleSAtIG5ld0luZGV4XG4gICAgICAgICAgICAgIHRoaXMuZnJlZUxpc3RbIG5ld0luZGV4IF0gPSBuZXdGcmVlU2l6ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoIGlkeCAhPT0gLTEgKSBkZWxldGUgdGhpcy5mcmVlTGlzdFsgaWR4IF1cblxuICAgIGlmKCBpZHggPT09IC0xICkge1xuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyggdGhpcy5saXN0ICksXG4gICAgICAgICAgbGFzdEluZGV4XG5cbiAgICAgIGlmKCBrZXlzLmxlbmd0aCApIHsgLy8gaWYgbm90IGZpcnN0IGFsbG9jYXRpb24uLi5cbiAgICAgICAgbGFzdEluZGV4ID0gcGFyc2VJbnQoIGtleXNbIGtleXMubGVuZ3RoIC0gMSBdIClcblxuICAgICAgICBpZHggPSBsYXN0SW5kZXggKyB0aGlzLmxpc3RbIGxhc3RJbmRleCBdLnNpemVcbiAgICAgIH1lbHNle1xuICAgICAgICBpZHggPSAwXG4gICAgICB9XG5cbiAgICAgIHRoaXMubGlzdFsgaWR4IF0gPSB7IHNpemUsIGltbXV0YWJsZSwgcmVmZXJlbmNlczoxIH1cbiAgICB9XG5cbiAgICBpZiggaWR4ICsgc2l6ZSA+PSB0aGlzLmhlYXAubGVuZ3RoICkge1xuICAgICAgdGhyb3cgRXJyb3IoICdObyBhdmFpbGFibGUgYmxvY2tzIHJlbWFpbiBzdWZmaWNpZW50IGZvciBhbGxvY2F0aW9uIHJlcXVlc3QuJyApXG4gICAgfVxuICAgIHJldHVybiBpZHhcbiAgfSxcblxuICBhZGRSZWZlcmVuY2UoIGluZGV4ICkge1xuICAgIGlmKCB0aGlzLmxpc3RbIGluZGV4IF0gIT09IHVuZGVmaW5lZCApIHsgXG4gICAgICB0aGlzLmxpc3RbIGluZGV4IF0ucmVmZXJlbmNlcysrXG4gICAgfVxuICB9LFxuXG4gIGZyZWUoIGluZGV4ICkge1xuICAgIGlmKCB0aGlzLmxpc3RbIGluZGV4IF0gPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIHRocm93IEVycm9yKCAnQ2FsbGluZyBmcmVlKCkgb24gbm9uLWV4aXN0aW5nIGJsb2NrLicgKVxuICAgIH1cblxuICAgIGxldCBzbG90ID0gdGhpcy5saXN0WyBpbmRleCBdXG4gICAgaWYoIHNsb3QgPT09IDAgKSByZXR1cm5cbiAgICBzbG90LnJlZmVyZW5jZXMtLVxuXG4gICAgaWYoIHNsb3QucmVmZXJlbmNlcyA9PT0gMCAmJiBzbG90LmltbXV0YWJsZSAhPT0gdHJ1ZSApIHsgICAgXG4gICAgICB0aGlzLmxpc3RbIGluZGV4IF0gPSAwXG5cbiAgICAgIGxldCBmcmVlQmxvY2tTaXplID0gMFxuICAgICAgZm9yKCBsZXQga2V5IGluIHRoaXMubGlzdCApIHtcbiAgICAgICAgaWYoIGtleSA+IGluZGV4ICkge1xuICAgICAgICAgIGZyZWVCbG9ja1NpemUgPSBrZXkgLSBpbmRleFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5mcmVlTGlzdFsgaW5kZXggXSA9IGZyZWVCbG9ja1NpemVcbiAgICB9XG4gIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVtb3J5SGVscGVyXG4iXX0=
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
