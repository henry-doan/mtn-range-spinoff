// Move to centre of screen
translate(200.5, 200.5);

var BLACK = color(0, 0, 0);
var BACKGROUND = color(168, 180, 250);

var faceColor = color(59, 191, 36);
var edgeColor = color(162, 169, 189);
var lightVector =[0.5, -0.2, -2];
var backgroundLight = 0.2;
var nodeSize = 0;

var gridWidth = 25;
var gridHeight = 25;
var boxSize = min(width / gridWidth, width / gridHeight) - 2;
var heightScale = boxSize * 20;
var smoothness = 25;

/*******************************************************
 * 
 * Linear algebra functions
 * 
*******************************************************/

var subtractVectors = function(v1, v2){
    return [[v1[0] - v2[0]],
            [v1[1] - v2[1]],
            [v1[2] - v2[2]]];
};

var normaliseVector = function(v) {
    var d = sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    return [v[0]/d, v[1]/d, v[2]/d];
};

var normalOfPlane = function(face, nodes) {
    var n1 = nodes[face[0]];
    var n2 = nodes[face[1]];
    var n3 = nodes[face[2]];
    
    var v1 = subtractVectors(n1, n2);
    var v2 = subtractVectors(n1, n3);
    
    var v3 = [[v1[1]*v2[2] - v1[2]*v2[1]],
              [v1[2]*v2[0] - v1[0]*v2[2]],
              [v1[0]*v2[1] - v1[1]*v2[0]]];
              
    return v3;
};

var dotProduct = function(v1, v2){
    // Assume everything has 3 dims
    return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
};

var translate3D = function(x, y, z, nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i] = [nodes[i][0] + x, nodes[i][1] + y, nodes[i][2] + z];
    }
};

var rotateY3D = function(theta, nodes) {
    var ct = cos(theta);
    var st = sin(theta);
    var x, y, z;

    for (var i = 0; i < nodes.length; i+=1) {
        x = nodes[i][0];
        y = nodes[i][1];
        z = nodes[i][2];
        nodes[i] = [ct*x + st*z, y, -st*x + ct*z];
    }
};

var rotateX3D = function(theta, nodes){
    var ct = cos(theta);
    var st = sin(theta);
    var x, y, z;
    
    for (var i = 0; i < nodes.length; i+=1) {
        x = nodes[i][0];
        y = nodes[i][1];
        z = nodes[i][2];
        nodes[i] = [x, ct*y - st*z, st*y + ct*z];
    }
};

var rotateZ3D = function(theta, nodes){
    var ct = cos(theta);
    var st = sin(theta);
    var x, y, z;
    
    for (var i = 0; i < nodes.length; i+=1) {
        x = nodes[i][0];
        y = nodes[i][1];
        z = nodes[i][2];
        nodes[i] = [ct*x - st*y, st*x + ct*y, z];
    }
};

// Find the weighted average of two vectors with weight of w
var averageNode = function(nodes) {
    var node = [];

    for (var i = 0; i < nodes[0].length; i++) {
        var d = 0;
        
        for (var n = 0; n < nodes.length; n++) {
            d += nodes[n][i];
        }
        
        d /= nodes.length;
        node.push(d);
    }
    
    return node;
};

/*******************************************************
 * 
 * Create object functions
 * 
*******************************************************/

var createCuboid = function(x, y, z, w, h, d) {
    var nodes = [[x,     y,     z], [x,     y,     z + d],
                 [x,     y + h, z], [x,     y + h, z + d],
                 [x + w, y,     z], [x + w, y,     z + d],
                 [x + w, y + h, z], [x + w, y + h, z + d]];

    var faces= [[0, 1, 3, 2], [1, 0, 4, 5],
                [0, 2, 6, 4], [3, 1, 5, 7],
                [5, 4, 6, 7], [2, 3, 7, 6]];

    return { 'nodes': nodes, 'faces': faces };
};

var createGrid = function(width, height, smoothness) {
    var grid = [];
    var smoothing = 1 / smoothness;
    
    for (var y = 0; y < height; y++) {
        var row = [];
        for (var x = 0; x < width; x++) {
            row.push(noise(x * smoothing, y * smoothing));
        }
        grid.push(row);
    }
    
    return grid;
};

var createGribObject = function(width, height, smoothness) {
    var grid = createGrid(width, height, smoothness);
    var nodes = [];
    var edges = [];
    var faces = [];
    var colors = [];
    
    // Create nodes
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            var nx = (x - width / 2 + 0.5) * boxSize;
            var ny = (y - height / 2 + 0.5) * boxSize;
            var nz = (grid[y][x] - 0.5) * heightScale;
            nodes.push([nx, ny, nz]);
        }
    }
    
    // Create edges
    /*
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (x > 0) {
                edges.push([x + y * width, x + y * width - 1]);
            }
            if (y > 0) {
                edges.push([x + y * width, x + (y - 1) * width]);
            }
        }
    }
    
    // Make triangles
    for (var x = 0; x < width - 1; x++) {
        for (var y = 0; y < height - 1; y++) {
            if (random() < 0.5) {
                edges.push([x + y * width, x + (y + 1) * width + 1]);   
            } else {
                edges.push([x + y * width + 1, x + (y + 1) * width]);   
            }
        }
    }
    */
    
    var GREEN = color(60, 200, 40);
    var BROWN = color(30, 100, 20);
    var BROWN = color(80, 210, 60);
    
    // Create faces
    for (var x = 0; x < width - 1; x++) {
        for (var y = 0; y < height - 1; y++) {
            var n1 = x + y * width;
            var n2 = x + (y + 1) * width;
            if (random() < 0.5) {
                faces.push([n1, n1 + 1, n2 + 1]);
                faces.push([n2, n1, n2 + 1]);
            } else {
                faces.push([n1, n1 + 1, n2]);
                faces.push([n2, n1 + 1, n2 + 1]);   
            }
            //colors.push(lerpColor(GREEN, BROWN, random()));
            //colors.push(lerpColor(GREEN, BROWN, random()));
            colors.push(BROWN);
            colors.push(BROWN);
        }
    }
    
    // Create edge
    var BROWN = color(120, 80, 30);
    
    var n = nodes.length;
    for (var x = 0; x < width; x++) {
        var nx = (x - width / 2 + 0.5) * boxSize;
        var ny = (-height / 2 + 0.5) * boxSize;
        var nz = -0.4 * heightScale;
        nodes.push([nx, ny, nz]);
        
        if (x > 0) {
            var nx = x * width;
            faces.push([nx - width, nx, n + x, n + x - 1]);
            colors.push(BROWN);
        }
    }
    
    var n = nodes.length;
    for (var x = 0; x < width; x++) {
        var nx = (x - width / 2 + 0.5) * boxSize;
        var ny = (height / 2 - 0.5) * boxSize;
        var nz = -0.4 * heightScale;
        nodes.push([nx, ny, nz]);
        
        if (x > 0) {
            var nx = x * width + height - 1;
            faces.push([n + x - 1, n + x, nx, nx - width]);
            colors.push(BROWN);
        }
    }
    
    var n = nodes.length;
    for (var x = 0; x < width; x++) {
        var nx = (-width / 2 + 0.5) * boxSize;
        var ny = (x - height / 2 + 0.5) * boxSize;
        var nz = -0.4 * heightScale;
        nodes.push([nx, ny, nz]);
        
        if (x > 0) {
            faces.push([n + x - 1, n + x, x, x - 1]);
            colors.push(BROWN);
        }
    }
    
    var n = nodes.length;
    for (var x = 0; x < width; x++) {
        var nx = (width / 2 - 0.5) * boxSize;
        var ny = (x - height / 2 + 0.5) * boxSize;
        var nz = -0.4 * heightScale;
        nodes.push([nx, ny, nz]);
        
        if (x > 0) {
            var nx = x + (width - 1) * height;
            faces.push([nx - 1,  nx, n + x, n + x - 1]);
            colors.push(BROWN);
        }
    }
    
    
    
    return {
        nodes: nodes,
        edges: edges,
        faces: faces,
        colors: colors
    };
};

var createEdge = function() {
    
};

/*******************************************************
 * 
 *      Create objects
 * 
*******************************************************/

var grid = createGribObject(gridWidth, gridHeight, smoothness);

var cube = createCuboid(-100, -100, -100, 200, 200, 200);
var objects = [grid];

lightVector = normaliseVector(lightVector);

/*******************************************************
 * 
 *      Draw function
 * 
*******************************************************/

var draw = function() {
    var i;
    var face, nodes, node1, node2;
    
    background(BACKGROUND);

    for (var o in objects) {
        var obj = objects[o];
        nodes = obj.nodes;
        
        if ('edges' in obj) {
            var edges = obj.edges;
            stroke(edgeColor);
        
            for (var i = 0; i < edges.length; i++) {
                node1 = nodes[edges[i][0]];
                node2 = nodes[edges[i][1]];
                line(node1[0], node1[1], node2[0], node2[1]);
            }     
        }
        
        if ('faces' in obj) {
            for (var f in obj.faces) {
                face = obj.faces[f];
                var fnorm = normalOfPlane(face, nodes);
                
                if (fnorm[2] < 0) {
                    var l = max(0, dotProduct(lightVector, normaliseVector(fnorm)));
                    l = backgroundLight + (1 - backgroundLight) * l;
                    var c = lerpColor(BLACK, obj.colors[f], l);
                    fill(c);
                    stroke(c);
                      
                    if (face.length === 3) {
                        triangle(nodes[face[0]][0], nodes[face[0]][1],
                                 nodes[face[1]][0], nodes[face[1]][1],
                                 nodes[face[2]][0], nodes[face[2]][1]);
                    } else {
                        quad(nodes[face[0]][0], nodes[face[0]][1],
                             nodes[face[1]][0], nodes[face[1]][1],
                             nodes[face[2]][0], nodes[face[2]][1],
                             nodes[face[3]][0], nodes[face[3]][1]);
                    }
                }
            }
        }
        
        if (nodeSize && 'nodes' in obj) {
            fill(255, 0, 0);
            noStroke();
            for (var i = 0; i < nodes.length; i++) {
                ellipse(nodes[i][0], nodes[i][1], nodeSize, nodeSize);
            }  
        }
    }
};

var mouseDragged = function() {
    var dx =  0.5 * (mouseX - pmouseX);
    var dy = -0.5 * (mouseY - pmouseY);
    
    for (var obj = 0; obj < objects.length; obj++) {
        var nodes = objects[obj].nodes;
        rotateY3D(dx, nodes);
        rotateX3D(dy, nodes);
    }
};

var keyPressed = function() {
    var f = 0;
    var d = 0;
    if (keyCode === LEFT) {
        f = rotateY3D;
        d = -2;
    } else if (keyCode === RIGHT) {
        f = rotateY3D;
        d = 2;
    } else if (keyCode === UP) {
        f = rotateX3D;
        d = 2;
    } else if (keyCode === DOWN) {
        f = rotateX3D;
        d = -2;
    }
    
    if (f !== 0) {
        for (var obj in objects) {
            f(d, objects[obj].nodes); 
        }
    }
};

rotateZ3D(-45, grid.nodes);
rotateX3D(60, grid.nodes);
//rotateX3D(40, grid.nodes);