// Create the SVG element
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

// Set the width and height of the SVG element
svg.setAttribute("width", 500);
svg.setAttribute("height", 500);

// Create a <defs> element to hold the styles
var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

// Create a <style> element to define the styles
var style = document.createElementNS("http://www.w3.org/2000/svg", "style");

// Set the styles for the SVG element using the "style" attribute
style.textContent = "rect.background { fill: white; }";

// Add the <style> element to the <defs> element
defs.appendChild(style);

// Add the <defs> element to the SVG element
svg.appendChild(defs);

// Create a rectangle for the background and apply the "background" class
var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
rect.setAttribute("class", "background");
rect.setAttribute("width", "100%");
rect.setAttribute("height", "100%");

// Add the rectangle to the SVG element
svg.appendChild(rect);

// Generate random patterns using colors that are common in natural patterns, such as brown and green
for (var i = 0; i < 50; i++) {
  // Create a <line> element to generate a random line
  var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

  // Set the attributes of the line (e.g. start and end positions, color)
  line.setAttribute("x1", Math.random() * 500);
  line.setAttribute("y1", Math.random() * 500);
  line.setAttribute("x2", Math.random() * 500);
  line.setAttribute("y2", Math.random() * 500);
  line.setAttribute("stroke", getRandomColor()); // Choose a random color

  // Add some variability to the line to make it appear more hand-drawn
  line.setAttribute("stroke-width", Math.random() * 10);
  line.setAttribute("stroke-dasharray", Math.random() * 10);

  // Add the line to the SVG element
  svg.appendChild(line);
}

// Generate random noise using colors that are common in natural patterns, such as brown and green
for (var i = 0; i < 50; i++) {
  // Create a <rect> element to generate a random noise element
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  // Set the attributes of the rect (e.g. position, size, color)
  rect.setAttribute("x", Math.random() * 500);
  rect.setAttribute("y", Math.random() * 500);
  rect.setAttribute("width", Math.random() * 10);
  rect.setAttribute("height", Math.random() * 10);
  rect.setAttribute("fill", getRandomColor()); // Choose a random color

  // Add some variability to the rect to make it appear more hand-drawn
  rect.setAttribute("rx", Math.random() * 10);
  rect.setAttribute("ry", Math.random() * 10);

  // Add the rect to the SVG element
  svg.appendChild(rect);

// Create a button to generate the random patterns
var button = document.createElement("button");
button.innerHTML = "Generate";

// When the button is clicked, generate the random patterns
button.addEventListener("click", function() {
  // Add the SVG element to the page
  document.body.appendChild(svg);

  // Show the SVG data in the text output
  document.getElementById("output").innerHTML = svg.outerHTML;
});
}
// Add the button to the page
document.body.appendChild(button);

// Create a text output element
var output = document.createElement("pre");
output.id = "output";

// Add the text output element to the page
document.body.appendChild(output);

// Create a download link for the SVG data
var link = document.createElement("a");
link.innerHTML = "Download";
link.setAttribute("download", "pattern.svg");
link.setAttribute("href", "data:image/svg+xml," + encodeURIComponent(svg.outerHTML));

// Add the download link to the page
document.body.appendChild(link);

// Function to choose a random color that is common in natural patterns
function getRandomColor() {
  var colors = ["brown", "green", "tan", "maroon", "olive", "navy", "teal", "grey"];
  var index = Math.floor(Math.random() * colors.length);
  return colors[index];
}


