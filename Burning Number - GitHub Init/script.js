const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const burnBtn = document.getElementById("burn-btn");
const resetBtn = document.getElementById("reset-btn");
const rulesBtn = document.getElementById("rules-btn");
const rulesDiv = document.getElementById("round-info-div");
const showGraph = document.getElementById("show-btn");
const graphSelector = document.getElementById("graph-select");
const parameterDiv = document.getElementById("parameter-container");

let isRulesShowing = true;

const rangeCalc = (arr) => {
    arr.sort((a, b) => a - b);
    return arr[arr.length - 1] - arr[0];
};



//input coords in the form [x,y]_v\in V
const getZoom = (xPos, yPos) => {
    const xRange = rangeCalc(xPos);
    const yRange = rangeCalc(yPos);
    return Math.min(1 / yRange, 2 / xRange);
};



let gameState = {
    round : 0,
    isGraphBurned : false,
    isChoosing : true,
    dispProps : {
        zoom: 1,
        graphRad: 900,
        vtxRad: 50,
        edgeWeight: 10 
    },
    currentGraph : "petersen_graph"
};

const xCenter = canvas.width / 2;
const yCenter = canvas.height / 2;

const xConvert = (xPos) => {
    const newX = xCenter + (gameState.dispProps.graphRad * parseFloat(xPos));
    return newX;
};

const yConvert = (yPos) => {
    const newY = yCenter + (gameState.dispProps.graphRad * parseFloat(yPos));
    return newY;
};

//utility functions
const distance = (point1x, point1y, point2x, point2y) => Math.sqrt((point1x - point2x) ** 2 + (point1y - point2y) ** 2);




class Vertex {
    constructor(xRel, yRel, id) {
        this.position = {
            x: parseFloat(xRel).toFixed(2),
            y: parseFloat(yRel).toFixed(2)
        };
        this.radius = Math.max(20, gameState.dispProps.vtxRad);
        this.id = id;
        this.isBurned = false;
        this.isHighlight = false;
    }

    draw() {
        if (this.isHighlight) {
            ctx.shadowBlur = 50;
            ctx.shadowColor = "red";
        } else {
            ctx.shadowBlur = 0;
        }
        let node = new Path2D();
        const xLoc = xConvert(this.position.x);
        const yLoc = yConvert(this.position.y);
        const vtxRad = gameState.dispProps.vtxRad;
        node.arc(xLoc, yLoc, Math.max(20, vtxRad), 0, 2 * Math.PI, false);    
        const vtxGradient = ctx.createRadialGradient(xLoc, yLoc, Math.max(20 * 0.35, vtxRad * 0.35), xLoc, yLoc, Math.max(20, vtxRad));
        vtxGradient.addColorStop(0, "rgb(255,170,0)");
        vtxGradient.addColorStop(0.75, "rgb(255,140,0)");
        vtxGradient.addColorStop(1, "rgb(230,100,0)");
        ctx.fillStyle = this.isBurned ? "red" : vtxGradient ;
        ctx.fill(node);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.stroke(node);
        ctx.shadowBlur = 0;
        if (this.isHighlight) {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${Math.max(30, vtxRad + 10)}px Calibri`;
            ctx.fillText(`${this.id}`,xLoc, yLoc);
        }  
    }

    nbrs() {
        const nbrsList = [];
        const incEdges = edgeList.filter((edge) => edge.vtx1Id === this.id || edge.vtx2Id === this.id);
        incEdges.forEach((edge) => edge.vtx1Id === this.id ? nbrsList.push(vertices[edge.vtx2Id]) : nbrsList.push(vertices[edge.vtx1Id]));
        return nbrsList;
    }

    burnAdjacent() {
        this.nbrs().forEach((vtx) => {
            if (!vtx.isBurned) {
                animateEdge(this, vtx);
            }
        });
        
    }
}



const fetchGraph = async () => {
    try {
        const graphString = gameState.currentGraph;
        const res = await fetch(`vtx_positions_list_${graphString}.json`);
        const vtxPositions = await res.json();
        const vertices = [];
        vtxPositions.forEach((coord, index) => {
            vtx = new Vertex(parseFloat(coord[0]), parseFloat(coord[1]), index);
            vertices.push(vtx);
        });
        const edgeList =  await fetchEdgeList();
        return {vertices, edgeList};
    } catch (err) {
        alert(err.message);
    }
};

const fetchEdgeList = async () => {
    try {
        const graphString = gameState.currentGraph;
        const res = await fetch(`graph_edge_list_${graphString}.json`);
        const edges = await res.json();
        return toEdgeList(edges);
    } catch (err) {
        alert(err.message);
    }
};

const toEdgeList = (edges) => {
    const edgeList = [];
    edges.forEach(([vtx1Id, vtx2Id]) => {
        const vtxObj = {vtx1Id, vtx2Id};
        edgeList.push(vtxObj)
    });
    return edgeList;
};

const getVtxPosArr = async () => {
    if (vertices.length === 0) {
        const graph = await fetchGraph();
        vertices = graph.vertices;
        edgeList = graph.edgeList;
    }
    const vtxPosArr = {
        x: [],
        y: []
    };
    vertices.forEach((vtx) => {
        vtxPosArr.x.push(vtx.position.x);
        vtxPosArr.y.push(vtx.position.y);
    });
    return vtxPosArr;
};

const setBaseZoom = async () => {
    const vtxPosArr = await getVtxPosArr();
    const baseZoom = getZoom(vtxPosArr.x, vtxPosArr.y);
    console.log(`The base zoom level is set at ${baseZoom}`);
    gameState.dispProps.zoom = baseZoom;
};

const getBaseZoom = async () => {
    const vtxPosArr = await getVtxPosArr();
    const baseZoom = getZoom(vtxPosArr.x, vtxPosArr.y);
    return baseZoom;
};

const circleLayout = (n, rad) => {
    const vertexPositions = [];
    for (let i=0; i < n; i++) {
        const vtxPos = {
            x: xCenter + rad * Math.cos((2 * Math.PI / n) * i),
            y: yCenter - rad * Math.sin((2 * Math.PI / n) * i),
            id: i
        };
        vertexPositions.push(vtxPos);
    }
    return vertexPositions;
};


//vertices = vertexPositions.map(({x, y, id}) => new Vertex(x, y, id));



/*const edgeList = [
    {vtx1Id: 0, vtx2Id: 1},
    {vtx1Id: 1, vtx2Id: 2},
    {vtx1Id: 2, vtx2Id: 3},
    {vtx1Id: 3, vtx2Id: 4},
    {vtx1Id: 4, vtx2Id: 0},
    {vtx1Id: 2, vtx2Id: 4},
    {vtx1Id: 4, vtx2Id: 5},
    {vtx1Id: 5, vtx2Id: 6},
    {vtx1Id: 6, vtx2Id: 7},
    {vtx1Id: 7, vtx2Id: 8},
    {vtx1Id: 8, vtx2Id: 0}
];
*/



const drawEdge = (vtx1, vtx2) => {
    const xLoc1 = xConvert(vtx1.position.x);
    const yLoc1 = yConvert(vtx1.position.y);
    const xLoc2 = xConvert(vtx2.position.x);
    const yLoc2 = yConvert(vtx2.position.y);
    ctx.beginPath();
    ctx.moveTo(xLoc1, yLoc1);
    ctx.lineTo(xLoc2, yLoc2);
    ctx.lineWidth = Math.max(3, gameState.dispProps.edgeWeight);
    ctx.strokeStyle = "white";
    ctx.stroke();
};

const animateEdge = (vtx1, vtx2, duration = 1000) => {
    const xLoc1 = xConvert(vtx1.position.x);
    const yLoc1 = yConvert(vtx1.position.y);
    const xLoc2 = xConvert(vtx2.position.x);
    const yLoc2 = yConvert(vtx2.position.y);
    const startTime = performance.now();
    const animate = (time) => {
        const elapsedTime = time - startTime;
        const progress = elapsedTime / duration;
        
        ctx.beginPath();
        ctx.moveTo(xLoc1, yLoc1);
        ctx.lineTo(xLoc2 * progress + (xLoc1 * (1 - progress)), yLoc2 * progress + (yLoc1 * (1 - progress)));
        ctx.lineWidth = Math.max(3, gameState.dispProps.edgeWeight);
        ctx.strokeStyle = "red";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xLoc2 * progress + (xLoc1 * (1 - progress)), yLoc2 * progress + (yLoc1 * (1 - progress)));
        ctx.lineTo(xLoc2, yLoc2);
        ctx.strokeStyle = "white";
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {

            vtx2.isBurned = true;
            drawGraph();
        }
    };
    requestAnimationFrame(animate);
};


let vertices = [];
let edgeList = [];



const drawGraph = async () => {
    console.log(`drawGraph has been called with base zoom: ${gameState.dispProps.zoom}`);
    if (vertices.length === 0) {
        const graph = await fetchGraph();
        vertices = graph.vertices;
        edgeList = graph.edgeList
    }
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const burnedVtcs = vertices.filter((vtx) => vtx.isBurned);
    vertices.forEach((vtx) => vtx.isBurned ? vtx.color = "red" : vtx.color = "orange");
    edgeList.forEach(edge => drawEdge(vertices[edge.vtx1Id], vertices[edge.vtx2Id]));
    vertices.forEach(vtx => {
        vtx.draw();
    });
};

const burn = () => {

    const burnedVtcs = vertices.filter((vtx) => vtx.isBurned);
    burnedVtcs.forEach((vtx) => {
        vtx.burnAdjacent();
    });
};




const zoom = async (event) => {
    gameState.dispProps.zoom = gameState.dispProps.zoom + (event.deltaY * -0.0001);
    gameState.dispProps.graphRad =  gameState.dispProps.zoom * 900;
    gameState.dispProps.vtxRad =  gameState.dispProps.zoom * 50;
    gameState.dispProps.edgeWeight =  gameState.dispProps.zoom *15
    console.log(gameState.dispProps.zoom, gameState.dispProps.graphRad, gameState.dispProps.vtxRad, gameState.dispProps.edgeWeight);
};


const reset = async () => {
    vertices = [];
    edgeList = [];
    const zoom = await getBaseZoom();
    gameState.dispProps.zoom = zoom;
    gameState.dispProps.graphRad = 900 * zoom;
    gameState.dispProps.vtxRad = 50 * zoom;
    gameState.dispProps.edgeWeight = 10 * zoom;
};




/*const update = async (vertices, edgeList) => {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const burnedVtcs = vertices.filter((vtx) => vtx.isBurned);
    vertices.forEach((vtx) => vtx.isBurned ? vtx.color = "red" : vtx.color = "orange");
    edgeList.forEach(edge => drawEdge(vertices[edge.vtx1Id], vertices[edge.vtx2Id]));
    vertices.forEach(vtx => vtx.draw());

};
*/
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom(e);
    drawGraph();
});

canvas.addEventListener('click', async (e) => {
    const xClick = e.offsetX;
    const yClick = e.offsetY;
    if (vertices.length === 0) {
        const graph = await fetchGraph();
        vertices = graph.vertices;
        edgeList = graph.edgeList;
    }
    vertices.forEach((vtx) => {
        const xLoc = xConvert(vtx.position.x);
        const yLoc = yConvert(vtx.position.y);
        if (distance(xClick, yClick, xLoc, yLoc) <= Math.max(20, gameState.dispProps.vtxRad + 10)) {
            vtx.isBurned = !vtx.isBurned;
            drawGraph();
        }
    });
});


const highlightOnMouse = async (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    if (vertices.length === 0) {
        const graph = await fetchGraph();
        vertices = graph.vertices;
        edgeList = graph.edgeList;
    }
    vertices.forEach((vtx) => {
        const xLoc = xConvert(vtx.position.x);
        const yLoc = yConvert(vtx.position.y);
        if (distance(x, y, xLoc, yLoc) <= Math.max(20, gameState.dispProps.vtxRad + 10)) {
                vtx.isHighlight = true;
        } else {
                vtx.isHighlight = false;
        }
        });
    drawGraph();
};

function debounce(func, delay) {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }

const debouncedHighlightOnMouse = debounce(highlightOnMouse, 10);

canvas.addEventListener('mousemove', debouncedHighlightOnMouse);


/*
canvas.addEventListener('mousemove', async (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    if (vertices.length === 0) {
        const graph = await fetchGraph();
        vertices = graph.vertices;
        edgeList = graph.edgeList;
    }
    vertices.forEach((vtx) => {
        const xLoc = xConvert(vtx.position.x);
        const yLoc = yConvert(vtx.position.y);
        if (distance(x, y, xLoc, yLoc) <= Math.max(20, gameState.dispProps.vtxRad)) {
                vtx.isHighlight = true;
        } else {
                vtx.isHighlight = false;
        }
        });
    drawGraph();
});
*/

burnBtn.addEventListener('click', burn);

resetBtn.addEventListener('click', () => {
    reset();
    drawGraph();
});

rulesBtn.addEventListener('click', () => {
    if (isRulesShowing) {
        rulesDiv.style.display = "none";
        isRulesShowing = !isRulesShowing;
    } else {
        rulesDiv.style.display = "block";
        isRulesShowing = !isRulesShowing;
    }
    
})

const updateCurrentGraph = async () => {
    const selectedGraph = graphSelector.value;
    const parameterInputs = document.querySelectorAll('#parameter-container input');
    const parameterArr = [...parameterInputs].map(el => el.value);
    if (selectedGraph === "complete_graph") {
        if (!parameterArr[0]) {
            alert("Please enter an integer between 1 and 29");
            return;
        }
        gameState.currentGraph = `complete_graph_${parameterArr[0]}`;
    } else if (selectedGraph === "complete_bipartite_graph") {
        gameState.currentGraph = `complete_bipartite_graph_${parameterArr[0]}_${parameterArr[1]}`;
    } else {
       gameState.currentGraph = selectedGraph; 
    }
    await reset();
    await drawGraph();
};

showGraph.addEventListener('click', updateCurrentGraph);

const graphFamilyParaSelect = (e) => {
    const selectedGraph = e.target.value;
    if (selectedGraph === 'complete_graph') {
        parameterDiv.innerHTML = `<label for="complete-graph-parameter-1">n=<input id="complete-graph-parameter-1" type="number" /></label>
        `;
    } else if (selectedGraph === 'complete_bipartite_graph') {
        parameterDiv.innerHTML = `<label for="complete-bipartite-graph-parameter-1">n=<input id="complete-bipartite-graph-parameter-1" type="number" /></label>

        <label for="complete-bipartite-graph-parameter-2">m=<input id="complete-bipartite-graph-parameter-2" type="number" /></label>
        `
    }
};

graphSelector.addEventListener('change', e => graphFamilyParaSelect(e))

window.addEventListener('load', async () => {
    await reset();
    console.log(`Base Zoom level is set at ${gameState.dispProps.zoom}`);
    await drawGraph();
});

