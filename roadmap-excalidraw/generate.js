#!/usr/bin/env node
/*
 * roadmap-excalidraw generator
 *
 * Turns a simple roadmap outline (JSON) into an Excalidraw scene (.excalidraw)
 * styled like roadmap.sh: a central dashed spine, big title, yellow topic boxes
 * alternating left/right of the spine, and purple subtopic boxes stacked under
 * each topic. Zero dependencies — Node stdlib only.
 *
 * Usage:
 *   node generate.js <outline.json> [-o roadmap.excalidraw]
 *
 * Outline schema:
 *   {
 *     "title": "Frontend",
 *     "topics": [
 *       { "name": "Internet",
 *         "subtopics": [
 *           { "name": "How does the internet work?", "level": "recommended" },
 *           "HTTP",                       // shorthand string == recommended
 *           { "name": "Browsers", "level": "optional" }
 *         ] }
 *     ]
 *   }
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// roadmap.sh-inspired style constants
// ---------------------------------------------------------------------------
const STYLE = {
  spineColor: '#0a33ff', // matches the source roadmap's vertical connector
  topicBg: '#ffe599', // yellow topic boxes
  topicStroke: '#1e1e1e',
  subRecommendedBg: '#d9ccf5', // solid purple == "recommended"
  subOptionalBg: 'transparent', // outlined purple == "optional"
  subStroke: '#6741d9',
  textColor: '#1e1e1e',
  fontFamily: 1, // 1 = hand-drawn (Excalifont/Virgil), matches the aesthetic
};

const LAYOUT = {
  topicW: 230,
  topicH: 50,
  subW: 210,
  subH: 38,
  topicFont: 20,
  subFont: 16,
  titleFont: 36,
  spineGap: 70, // horizontal gap from spine to the near edge of a topic box
  subGapY: 14, // vertical gap between stacked subtopics
  rowGap: 50, // vertical gap between topic rows (after the taller column)
  topicToSubGap: 26, // gap between a topic and its first subtopic
  topPad: 120, // space reserved under the title for the first row
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function rid() {
  return crypto.randomBytes(12).toString('base64url');
}
function nonce() {
  return Math.floor(Math.random() * 2 ** 31);
}

function baseProps() {
  return {
    angle: 0,
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    seed: nonce(),
    version: 1,
    versionNonce: nonce(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

// A rounded rectangle with bound, centered text.
function boxWithLabel({ x, y, w, h, text, bg, stroke, fontSize }) {
  const boxId = rid();
  const textId = rid();
  const box = Object.assign(baseProps(), {
    id: boxId,
    type: 'rectangle',
    x,
    y,
    width: w,
    height: h,
    strokeColor: stroke,
    backgroundColor: bg,
    fillStyle: 'solid',
    roundness: { type: 3 },
    boundElements: [{ type: 'text', id: textId }],
  });
  const label = Object.assign(baseProps(), {
    id: textId,
    type: 'text',
    x: x + 8,
    y: y + h / 2 - fontSize / 2,
    width: w - 16,
    height: fontSize * 1.25,
    strokeColor: STYLE.textColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    roundness: null,
    text,
    fontSize,
    fontFamily: STYLE.fontFamily,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId: boxId,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  });
  return [box, label];
}

// Standalone (unbound) text, e.g. the big title.
function freeText({ x, y, w, h, text, fontSize, align }) {
  return Object.assign(baseProps(), {
    id: rid(),
    type: 'text',
    x,
    y,
    width: w,
    height: h,
    strokeColor: STYLE.textColor,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    roundness: null,
    text,
    fontSize,
    fontFamily: STYLE.fontFamily,
    textAlign: align || 'center',
    verticalAlign: 'top',
    containerId: null,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  });
}

// A 2-point line between (x1,y1) and (x2,y2). Coordinates are absolute.
function connector({ x1, y1, x2, y2, color, dashed }) {
  return Object.assign(baseProps(), {
    id: rid(),
    type: 'line',
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    strokeColor: color,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeStyle: dashed ? 'dashed' : 'solid',
    strokeWidth: dashed ? 3 : 2,
    roundness: { type: 2 },
    points: [
      [0, 0],
      [x2 - x1, y2 - y1],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
  });
}

// ---------------------------------------------------------------------------
// outline normalization
// ---------------------------------------------------------------------------
function normalize(outline) {
  if (!outline || typeof outline !== 'object') {
    throw new Error('Outline must be a JSON object with "title" and "topics".');
  }
  const title = outline.title || 'Roadmap';
  const topics = (outline.topics || []).map((t) => {
    if (typeof t === 'string') t = { name: t };
    const subtopics = (t.subtopics || []).map((s) => {
      if (typeof s === 'string') s = { name: s };
      return { name: s.name, level: s.level === 'optional' ? 'optional' : 'recommended' };
    });
    return { name: t.name, subtopics };
  });
  if (!topics.length) throw new Error('Outline has no topics.');
  return { title, topics };
}

// ---------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------
function build(outline) {
  const { title, topics } = normalize(outline);
  const elements = [];
  const spineX = 0;

  // Title, centered above the spine.
  elements.push(
    freeText({
      x: spineX - 200,
      y: 0,
      w: 400,
      h: LAYOUT.titleFont * 1.25,
      text: title,
      fontSize: LAYOUT.titleFont,
      align: 'center',
    })
  );

  let cursorY = LAYOUT.topPad;
  let spineTop = LAYOUT.titleFont * 1.25 + 20;
  let spineBottom = cursorY;

  topics.forEach((topic, i) => {
    const onRight = i % 2 === 0;
    const topicY = cursorY;
    const topicX = onRight
      ? spineX + LAYOUT.spineGap
      : spineX - LAYOUT.spineGap - LAYOUT.topicW;
    const topicCenterY = topicY + LAYOUT.topicH / 2;

    // Connector: spine -> topic near edge.
    const nearEdgeX = onRight ? topicX : topicX + LAYOUT.topicW;
    elements.push(
      connector({
        x1: spineX,
        y1: topicCenterY,
        x2: nearEdgeX,
        y2: topicCenterY,
        color: STYLE.topicStroke,
      })
    );

    // Topic box.
    elements.push(
      ...boxWithLabel({
        x: topicX,
        y: topicY,
        w: LAYOUT.topicW,
        h: LAYOUT.topicH,
        text: topic.name,
        bg: STYLE.topicBg,
        stroke: STYLE.topicStroke,
        fontSize: LAYOUT.topicFont,
      })
    );

    // Subtopics stacked in a column under the topic, same side, indented.
    let subY = topicY + LAYOUT.topicH + LAYOUT.topicToSubGap;
    // Indent subtopics a little further from the spine than the topic.
    const subX = onRight
      ? topicX + 40
      : topicX + LAYOUT.topicW - LAYOUT.subW - 40;
    let prevAnchor = { x: topicX + LAYOUT.topicW / 2, y: topicY + LAYOUT.topicH };

    topic.subtopics.forEach((sub) => {
      const subCenter = { x: subX + LAYOUT.subW / 2, y: subY + LAYOUT.subH / 2 };
      elements.push(
        connector({
          x1: prevAnchor.x,
          y1: prevAnchor.y,
          x2: subCenter.x,
          y2: subY,
          color: STYLE.subStroke,
        })
      );
      const optional = sub.level === 'optional';
      elements.push(
        ...boxWithLabel({
          x: subX,
          y: subY,
          w: LAYOUT.subW,
          h: LAYOUT.subH,
          text: sub.name,
          bg: optional ? STYLE.subOptionalBg : STYLE.subRecommendedBg,
          stroke: STYLE.subStroke,
          fontSize: LAYOUT.subFont,
        })
      );
      prevAnchor = { x: subCenter.x, y: subY + LAYOUT.subH };
      subY += LAYOUT.subH + LAYOUT.subGapY;
    });

    const columnBottom = topic.subtopics.length
      ? subY - LAYOUT.subGapY
      : topicY + LAYOUT.topicH;
    spineBottom = Math.max(spineBottom, topicCenterY);
    cursorY = columnBottom + LAYOUT.rowGap;
  });

  // Central dashed spine (drawn first visually is fine; order doesn't matter much).
  elements.unshift(
    connector({
      x1: spineX,
      y1: spineTop,
      x2: spineX,
      y2: spineBottom,
      color: STYLE.spineColor,
      dashed: true,
    })
  );

  return {
    type: 'excalidraw',
    version: 2,
    source: 'roadmap-excalidraw',
    elements,
    appState: { viewBackgroundColor: '#ffffff', gridSize: null },
    files: {},
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function main(argv) {
  const args = argv.slice(2);
  let input = null;
  let output = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' || args[i] === '--output') {
      output = args[++i];
    } else if (!input) {
      input = args[i];
    }
  }
  if (!input) {
    console.error('Usage: node generate.js <outline.json> [-o roadmap.excalidraw]');
    process.exit(1);
  }
  const outline = JSON.parse(fs.readFileSync(input, 'utf8'));
  const scene = build(outline);
  if (!output) {
    const base = path.basename(input).replace(/\.json$/i, '');
    output = path.join(path.dirname(input), `${base}.excalidraw`);
  }
  fs.writeFileSync(output, JSON.stringify(scene, null, 2));
  console.error(`Wrote ${scene.elements.length} elements -> ${output}`);
}

if (require.main === module) main(process.argv);
module.exports = { build, normalize };
