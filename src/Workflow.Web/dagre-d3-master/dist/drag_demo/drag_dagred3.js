var height = 900;

// Preparation of DagreD3 data structures
var g = new dagreD3.graphlib.Graph().setGraph({
  nodesep: 10,
  ranksep: 150,
  rankdir: "LR",
  marginx: 20,
  marginy: 20
});
// Data for this example
var data = {
  "nodes": [
    "host_a",
    "comp_with_long_name",
    "comp_b",
    "host_b",
    "comp_c",
    "comp_d"
  ],
  "edges": [{
    "source": "comp_with_long_name",
    "target": "host_a"
  }, {
    "source": "comp_b",
    "target": "host_a"
  }, {
    "source": "comp_c",
    "target": "host_b"
  }, {
    "source": "comp_b",
    "target": "host_b"
  }, {
    "source": "comp_d",
    "target": "host_a"
  }],
  "tips": {
    "comp_with_long_name": {
      "version": "1.2",
      "date": "12/03/2014"
    },
    "comp_b": {
      "version": "2.3.4",
      "date": "23/06/2014"
    },
    "comp_c": {
      "version": "UNKNOWN",
      "date": "UNKNOWN"
    },
    "comp_d": {
      "version": "0.4",
      "date": "01/11/2014"
    }
  }
};

// Define your menu
var hostMenu = [{
  title: 'Add component',
  action: function(elm, d, i) {
    console.log('Item #1 clicked!');
    console.log('The data for this circle is: ' + d);
  }
}]

var compMenu = [{
  title: 'Remove component',
  action: function(elm, d, i) {
    console.log('Item #1 clicked!');
    console.log('The data for this circle is: ' + d);
    delNode(d);
  }
}]

function updateGraph(data) {
  var nodes = data.nodes;
  var edges = data.edges;

  nodes.sort();
  // Add nodes
  nodes.forEach(function(node) {
    if (node.indexOf("host") == 0) {
      n = g.setNode(node, {
        labelType: "html",
        label: "<img src=\"http://cdn-img.easyicon.net/png/56/5670.png\"/><b>Comp: " + node + "</b>",
        class: "host",
        rx: 5,
        ry: 5,
        width: 150
      });
      n.customId = "node" + node;
    } else {
      n = g.setNode(node, {
        labelType: "html",
        label: "<b>" + node + "</b>",
        class: "comp",
        rx: 5,
        ry: 5,
        width: 150
      });
      n.customId = "node" + node;
    }
  });

  // Add edges
  edges.forEach(function(edge) {
    var edgeclass = "normal";
    if (edge.source == 'comp_d') {
      edgeclass = "warning";
    }
    e = g.setEdge(edge.source, edge.target, {
      label: "on",
      arrowhead: "vee",
      arrowheadStyle: "fill: #383838",
      class: edgeclass,
      lineInterpolate: 'bundle'
    });
    e.customId = edge.source + "-" + edge.target;
  });
  render();
}

function render() {
  var render = new dagreD3.render();
  // Set graph height and init zoom
  var svg = d3.select("svg");
  var container = svg.select("g");

  render(container, g);
  svg.attr("height", height);
/*
  d3.selectAll('svg g.host')
    .on('contextmenu', d3.contextMenu(hostMenu));

  d3.selectAll('svg g.comp')
    .on('contextmenu', d3.contextMenu(compMenu));*/
  svg.selectAll("g.comp rect")
      .attr("id", function (d) {
      return "node" + d;
  });
  var nodeDrag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove);

  nodeDrag.call(svg.selectAll("g.node"));
}
var svg = d3.select("svg");

function dragstart(d) {
  d3.event.sourceEvent.stopPropagation();
  console.log("Drag start");
}

function dragmove(d) {
  var node = d3.select(this),
    selectedNode = g.node(d);
  var prevX = selectedNode.x,
    prevY = selectedNode.y;

  selectedNode.x += d3.event.dx;
  selectedNode.y += d3.event.dy;
  node.attr('transform', 'translate(' + selectedNode.x + ',' + selectedNode.y + ')');

  var dx = selectedNode.x - prevX,
    dy = selectedNode.y - prevY;

  g.edges().forEach(function(e) {
    if (e.v == d || e.w == d) {
      edge = g.edge(e.v, e.w);
      console.dir(edge);
      translateEdge(g.edge(e.v, e.w), dx, dy);
      $('#' + edge.customId).attr('d', calcPoints(e));
    }
  })
}

function translateEdge(e, dx, dy) {
  e.points.forEach(function(p) {
    p.x = p.x + dx;
    p.y = p.y + dy;
  });
}

//taken from dagre-d3 source code (not the exact same)
function calcPoints(e) {
  var edge = g.edge(e.v, e.w),
    tail = g.node(e.v),
    head = g.node(e.w);
  var points = edge.points.slice(1, edge.points.length - 1);
  var afterslice = edge.points.slice(1, edge.points.length - 1)
  points.unshift(intersectRect(tail, points[0]));
  points.push(intersectRect(head, points[points.length - 1]));
  return d3.svg.line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .interpolate("basis")
    (points);
}

//taken from dagre-d3 source code (not the exact same)
function intersectRect(node, point) {
  var x = node.x;
  var y = node.y;
  var dx = point.x - x;
  var dy = point.y - y;
  var w = $("#" + node.customId).attr('width') / 2;
  var h = $("#" + node.customId).attr('height') / 2;
  var sx = 0,
    sy = 0;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }
  return {
    x: x + sx,
    y: y + sy
  };
}


d3.selectAll("g.node");

function addNode(node_name) {
  var idx = data.nodes.indexOf(node_name);
  if (idx == -1) {
    data.nodes.push(node_name);
    data.edges.push({
      'source': node_name,
      'target': 'host_b'
    });
    data.edges.push({
      'source': node_name,
      'target': 'host_a'
    });
    updateGraph(data);
  }
}

function delNode(node_name) {
  var idx = data.nodes.indexOf(node_name);
  if (idx != -1) {
    var new_nodes = []
    data.nodes.forEach(function(itm) {
      if (itm != node_name) {
        new_nodes.push(itm);
      }
    });
    new_nodes.sort();
    data.nodes = new_nodes;

    data.nodes = data.nodes.splice(idx, 1);
    var new_edges = [];
    data.edges.forEach(function(itm) {
      if (itm.source != node_name) {
        new_edges.push(itm);
      }
    });
    data.edges = new_edges;
    g.removeNode(node_name);

    render();
  }
}

updateGraph(data);