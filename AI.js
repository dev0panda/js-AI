//by the way, this code requires that a div with id "div1" exists in an html body in order to display the nodes

  //this is just an erf approximation:
  function erf(x) {
    // constants
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var p  =  0.3275911;

    // Save the sign of x
    var sign = 1;
    if (x < 0) {
        sign = -1;
    }
    x = Math.abs(x);

    // A&S formula 7.1.26
    var t = 1.0/(1.0 + p*x);
    var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);

    return sign*y;
}

dataExpected = []
dataSet = []
for (i=0; i<100; i++) {
    next = []
    ex = []
        for (j=0; j<100; j++) {
                next.push(Math.random())
	}
	m = Math.max.apply(Math, next)
	for (n=0; n<100; n++) {
	if (next[n] == m) {
	ex.push(1)
} else {ex.push(0)}
}
    dataSet.push(next)
    dataExpected.push(ex)
}


//Array definitions:
// w is for weights
// b is for biases
// I is for input values
// O is for output values

//could use on snake game
//another really simple example is to make it learn to find the largest item in a set:
//set the expected value set to be 0 for all values except for 1 for the largest input value

w = []
b = []
I = dataSet[0]
O = []
E = dataExpected[0]
zs = []

neur = []
z= []

layers = [I.length, 6, 3, E.length]


let c = [];

function genWB() {
for (let i=0; i<layers.length-1; i++) {
    w.push([])
    b.push([])
    randomlyPopulate(w[i], layers[i], layers[i+1], 1)
    randomlyPopulate(b[i], 1, layers[i+1], 0.5)
}
}


/*function squish(x, d) {
    if (!d){return Math.max(0,x)}
    else {if (x<=0) {return 0} else {return 1}}
}*/
function squish(x, d) {
    if (!d){return erf(x)}
    else {return Math.exp(-x*x)}
}

function randomlyPopulate(arr, a, b, scale) {
    for (i=0; i<a; i++) {
        c=[]
        for (j=0; j<b; j++) {
            c.push(scale*rng())
        }
        arr.push(c)
    }
}

function rng() {
    return -0.5+Math.random();
}


function calculate(input, i, we, bi) {
  //console.log(input)
  zs= []
  let nextinput = []
  let s
  //console.log(we[i][0].length)
        for (let k=0; k<we[i][0].length; k++) {
          s=0
  //console.log(we[i].length)
          for (let j=0; j<we[i].length; j++) {
            s+= input[j]*we[i][j][k]
            }
            s+=bi[i][0][k]
            zs.push(s)
            s=squish(s)
            nextinput.push(s)  
        }
//console.log(nextinput)
  return nextinput
}


function calculatediterated(inp, we, bi, nset, zset) {
  let n = inp.slice()
  for (i=0; i<we.length; i++) {
  n = calculate(n.slice(), i, we, bi).slice()
  nset.push(n)
  zset.push(zs)
  }
  return n.slice()
}

function cost(s1, s2) {
// cost = sum of (xactual-xexpected)^2
  var s=0
  for (i=0; i<s1.length; i++) {
    s+=(s1[i]-s2[i])*(s1[i]-s2[i])
  }
  return s
}

/*
function gradient() {
    //should return a vector of all changes to each weight and bias

    //first find all rates of change of weights and biases in the first layer:
    //
    grad = []
    n=neur.length-1
    wl = w.length-1
    wll = w[wl].length
//find all delCost/delAn
//find all delA_n/delZ_n
    dCostdA_n = []
    dA_ndZ_n = []
    dzdw = []
    for (i=0; i<neur[n].length; i++) {
        dCostdA_n.push(2*(E[i]-neur[n][i]))
        dA_ndZ_n.push(squish(z[n][i], 1))
    }
//find all delz_n/delw_n
    for (i = 0; i < wll; i++) {
      for (j=0; j<w[wl][i].length; j++) {
        dzdw.push(neur[n-1][i])
      }
      
    }

}
*/

function backpropl(L, cd) {
  dcda = []
  dadz = []
  dzdw = []
  dzda = []
  der = [dcda, dadz, dzdw, dzda]
  chainder = [[],[]]
  next = []
  nL = neur.length-1
  //console.log("test", neur[L].length)
    for (let i=0; i<neur[L].length; i++) {
        if (L==nL) {dcda.push(E[i]-neur[nL][i])}
      dadz.push(squish(neur[L][i], 1))
      }
  // console.log("test2")
  if (L!=nL) {dcda = cd.slice()}
  for (let i=0; i<w[L].length; i++) {
    zw = []
    for (let j=0; j<w[L][0].length; j++) {
      if (!L) {zw.push(I[i])} else {zw.push(neur[L-1][i])}
      dzda.push(w[L][i][j])
      //console.log(i*w[L][0].length+j)
    }
    dzdw.push(zw)
  }
  //next step is to use the partial derivatives multiplied for chain rule derivatives ls
  for (let i=0; i<dzdw.length; i++) {
    n=0
    for (let j=0; j<dzdw[0].length; j++) {
      if (j==0) {chainder[1].push(dcda[j]*dadz[j])}
      n+=dcda[j]*dadz[j]*w[L][i][j]
      chainder[0].push(dcda[j]*dadz[j]*dzdw[i][j])
    }
    next.push(n)
  }
  return [chainder, next];
}

function backpropagate() {
  layercost = []
  layerarrays = []
  for (let i=neur.length-1; i>=0; i--) {
    layerarrays.push(backpropl(i, layercost[layercost.length-1]))
    layercost.push(layerarrays[layerarrays.length-1][1])
    //console.log(layerarrays, layercost)
  }
  return layerarrays;
  //it returns in the form of [   [ [[], []], [] ], [ [[], []], [] ], [ [[], []], [] ], [ [[], []], [] ]   ]
}

function descend(grad, scale) {
  gradient = grad.slice();
  wnew = [[], [], []]
  bnew = [[], []]
  der = 0
  for (let l=neur.length-1; l>=0; l--) {
  for (let i=0; i<w[l].length; i++) {
    for (let j=0; j<w[l][i].length; j++) {
        //I COULD JUST AVERAGE THEM HERE :facepalm: (now it has to take an array of arrays of arrays as input)
        der = 0
        for (k=0; k<gradient.length; k++) {
            der+=gradient[k][neur.length-1-l][0][0][i*w[l][i].length+j]
        }
        der/=gradient.length
        //wnew[0].push(w[l][i][j]+scale*gradient[l][0][0][i*w[l][i].length+j])
        wnew[0].push(w[l][i][j]+scale*der)
    }
    wnew[1].push(wnew[0])
    wnew[0] = []
    
  }
  for (let bi=0; bi<b[l][0].length; bi++) {
    der = 0
    for (k=0; k<gradient.length; k++) {
        der+=gradient[k][l][0][1][bi]
    }
    der/=gradient.length
    bnew[0].push(b[l][0][bi]+scale*der)
  }
    wnew[2].push(wnew[1])
    wnew[1] = []
    bnew[1].push([bnew[0]])
    bnew[0] = []
  }
  //both of these are flipped in order
  console.log(wnew[2])
  w = wnew[2].reverse()
  b = bnew[1].reverse()
}





function displayneurons(set) {
var neu = []
for (i=0; i<set.length; i++) {
  a=Math.floor(parseInt(set[i]*255))
  if (a > 255) { a1="FF"}
  else {a1=Math.abs(a).toString(16)}
  if (a1.length == 1) {
    a1 = "0" + a1}

  neu[i] = document.createElement("div")
  neu[i].style.display = "inline-block"
  if (Math.sign(a)==-1) {neu[i].style.backgroundColor = "#" + "0000" + a1} else {
  neu[i].style.backgroundColor = "#" + a1 + "0000"}

  neu[i].style.padding = "0px"
  neu[i].style.margin = "0px"
  neu[i].style.width = "25px"
  neu[i].style.height = "25px"
  neu[i].style.fontsize = "1px"
  neu[i].style.wordWrap ="break-word"

  if (Math.sign(set[i]) == -1 || set[i]<0.31) {neu[i].style.color = "#FFFFFF"}
  //use this to display the number:
  //neu[i].innerText=Math.floor(10*set[i])/10
  neu[i].innerText=""
  document.getElementById("div1").appendChild(neu[i])
}
}
/* turns out this stuff doesn't really need to be implemented :shrug:
function avggrad(gradarray) {
  newgrad = []
    //this is for each gradient:
	gradindex1 = []
	for (j=0; j<gradarray[i].length; j++) {
//each gradient layer
		gradindex2 = []
		for (k=0; k<gradarray[i][0].length; k++) {
			//these are w and b:
			for (i=0; i<gradarray.length; i++) {
			for (l=0; l<gradarray[i][0][0][0].length; l++) {
        console.log(gradarray[i][0][0][0][l])
			}
        
			}
  			

		}
		//this is like whatever:
	}
    

}*/

function recalculate() {
    neur = []
z = []
zs = []
O = []
O=calculatediterated(I, w, b, neur, z)
}


function avgcost(i1, i2) {
    derivatives = []
    s = I
    e = E
    for (let i=i1; i<i2; i++) {
        I = dataSet[i]
        E = dataExpected[i]
        recalculate()
        //console.log(i)
        derivatives.push(backpropagate())
    }
    I = s
    E = e
    recalculate()
    return derivatives
}


function displayfull() {
    document.body.style.backgroundColor = "#204060" 
    recalculate()
document.getElementById("div1").innerHTML=""
displayneurons(I)
document.getElementById("div1").innerHTML+="<br><br><hr>"
displayneurons(neur[0])
document.getElementById("div1").innerHTML+="<br><br><hr>"
displayneurons(neur[1])
//document.getElementById("div1").innerHTML+="<br><br><hr>"
//displayneurons(neur[2])
//document.getElementById("div1").innerHTML+="<br><br><hr>"
//displayneurons(neur[3])
document.getElementById("div1").innerHTML+="<br><br><hr>"
displayneurons(O.slice())
console.log(cost(O, E))
}

function repeatback(inter, s) {
  setInterval( function() {
    descend(backpropagate(), s)
    displayfull()
  }, inter)
}

genWB()

/* arrays and stuff here:

*/