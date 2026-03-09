const SIZE = 500;
const COLOR_PALETTE = ["brown", "green", "tan", "maroon", "olive", "navy", "teal", "grey"];

function getRandomColor() {
  const index = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[index];
}

function buildPatternSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", SIZE);
  svg.setAttribute("height", SIZE);

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = "rect.background { fill: white; }";
  defs.appendChild(style);
  svg.appendChild(defs);

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("class", "background");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  svg.appendChild(background);

  for (let i = 0; i < 50; i += 1) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", Math.random() * SIZE);
    line.setAttribute("y1", Math.random() * SIZE);
    line.setAttribute("x2", Math.random() * SIZE);
    line.setAttribute("y2", Math.random() * SIZE);
    line.setAttribute("stroke", getRandomColor());
    line.setAttribute("stroke-width", Math.random() * 10);
    line.setAttribute("stroke-dasharray", Math.random() * 10);
    svg.appendChild(line);
  }

  for (let i = 0; i < 50; i += 1) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", Math.random() * SIZE);
    rect.setAttribute("y", Math.random() * SIZE);
    rect.setAttribute("width", Math.random() * 10);
    rect.setAttribute("height", Math.random() * 10);
    rect.setAttribute("fill", getRandomColor());
    rect.setAttribute("rx", Math.random() * 10);
    rect.setAttribute("ry", Math.random() * 10);
    svg.appendChild(rect);
  }

  return svg;
}

const button = document.createElement("button");
button.textContent = "Generate";

const output = document.createElement("pre");
output.id = "output";

const link = document.createElement("a");
link.textContent = "Download";
link.setAttribute("download", "pattern.svg");
link.setAttribute("href", "#");

button.addEventListener("click", () => {
  const oldSvg = document.querySelector("svg[data-generated='true']");
  if (oldSvg) {
    oldSvg.remove();
  }

  const svg = buildPatternSvg();
  svg.dataset.generated = "true";
  document.body.appendChild(svg);
  output.textContent = svg.outerHTML;
  link.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`);
});

document.body.appendChild(button);
document.body.appendChild(output);
document.body.appendChild(link);
