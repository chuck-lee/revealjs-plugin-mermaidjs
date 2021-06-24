/*
 *  BSD 3-Clause License
 *  Copyright (c) 2021, Chuck Lee
 *
 *  Plugin of reveal.js for mermaid.js replacing diagram code block with svg element
 */

const ID = 'mermaid';
const DIAGRAM_SELECTOR = 'section[data-markdown][data-markdown-parsed] code.mermaid';

const SVG_SCALE_MIN = 0.5;
const SVG_SCALE_MAX = 10.0;
const SVG_SCALE_STEP = 0.2;

const SVG_MOVE_STEP = 0.1;

let SVG_INFO = {};
let CURRENT_SVG_INFO = null;

function svg_zoom(event) {
  event.stopPropagation();
  event.preventDefault();

  let target = event.currentTarget;

  let svg_element = target.querySelector("svg");
  let svg_id = svg_element.id;

  let svg_scale = SVG_INFO[svg_id]['scale'];
  if (event.deltaX < 0 || event.deltaY < 0 || event.deltaZ < 0) {
    svg_scale += SVG_SCALE_STEP;
  } else {
    svg_scale -= SVG_SCALE_STEP;
  }

  if (svg_scale < SVG_SCALE_MIN) {
    svg_scale = SVG_SCALE_MIN;
  } else if (svg_scale > SVG_SCALE_MAX) {
    svg_scale = SVG_SCALE_MAX;
  }

  SVG_INFO[svg_id]['scale'] = svg_scale;

  update_svg_style(SVG_INFO[svg_id]);
}

function svg_mousedown(event) {
  event.stopPropagation();
  event.preventDefault();

  let target = event.currentTarget;
  let svg_element = target.querySelector("svg");
  let svg_id = svg_element.id;

  CURRENT_SVG_INFO = SVG_INFO[svg_id];

  document.addEventListener("mousemove", svg_mousemove, false);
  document.addEventListener("mouseup", svg_mouseup, false);
}

function svg_mouseup(event) {
  event.stopPropagation();
  event.preventDefault();

  CURRENT_SVG_INFO = null;

  document.removeEventListener("mousemove", svg_mousemove, false);
  document.removeEventListener("mouseup", svg_mousemove, false);
}

function svg_mousemove(event) {
  let offset_x = CURRENT_SVG_INFO['offset_x'];
  let offset_y = CURRENT_SVG_INFO['offset_y'];

  offset_x += event.movementX;
  offset_y += event.movementY;

  CURRENT_SVG_INFO['offset_x'] = offset_x;
  CURRENT_SVG_INFO['offset_y'] = offset_y;

  update_svg_style(CURRENT_SVG_INFO);
}

function update_svg_style(svg_info) {
  let svg_element = document.querySelector("#" + svg_info['id']);
  let scale = svg_info['scale'];
  let offset_x = svg_info['offset_x'];
  let offset_y = svg_info['offset_y'];
  svg_element.setAttribute('style',
                           'transform: scale(' + scale + ', ' + scale + ') translate(' + (offset_x / scale) + 'px, ' + (offset_y / scale) + 'px);');
}

function init(deck) {
  mermaid.mermaidAPI.initialize({
    startOnLoad:false
  });

  let diagram_nodes = deck.getRevealElement()
                     .querySelectorAll(DIAGRAM_SELECTOR);
  SVG_INFO = {};
  for (let i = 0; i < diagram_nodes.length; i++) {
    let diagram_node = diagram_nodes[i];

    mermaid.mermaidAPI.render('mermaid_' + i,
                              diagram_node.textContent,
                              function (svgGraph){

      let diagram_svg_node = document.createElement('div');
      diagram_svg_node.setAttribute('class', 'mermaid');
      diagram_svg_node.insertAdjacentHTML('afterbegin', svgGraph);

      let parent_node = diagram_node.parentNode;
      parent_node.parentNode.replaceChild(diagram_svg_node, parent_node);

      let diagram_svg_element = diagram_svg_node.querySelector("svg");
      let svn_element_id = diagram_svg_element.id;
      SVG_INFO[svn_element_id] = {
        "id": svn_element_id,
        "scale": 1,
        "offset_x": 0,
        "offset_y": 0
      };

      diagram_svg_node.addEventListener("wheel", svg_zoom, false);
      diagram_svg_node.addEventListener("mousedown", svg_mousedown, false);
    });
  }
};

RevealMermaid = {
  id: ID,
  init: init,
};
