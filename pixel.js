let table;
let mouseIsDown = false;

let currentChange = [];
let changes = [];

const MAX_UNDO = 6;

window.addEventListener("load", () => {
  table = document.getElementsByTagName("table")[0];
  resizeTable();

  window.addEventListener("click", e => {
    // check if it's in the table
    let target = e.target;
    while (target && target !== table) {
      target = target.parentNode;
    }
    if (target === table) {
      e.preventDefault();
    }
    target = e.target;
    if (target.tagName === "TD") {
      
      if (target.style.backgroundColor !== "rgb(255, 255, 255)") {
        target.style.backgroundColor = "rgb(255, 255, 255)";
      } else if (target.style.backgroundColor !== document.getElementById("color").value) {
        target.style.backgroundColor = document.getElementById("color").value;
      }
    }
  });
  window.addEventListener("mousedown", e => {
    // check if it's in the table
    let target = e.target;
    while (target && target !== table) {
      target = target.parentNode;
    }
    if (target === table) {
      e.preventDefault();
    }
    mouseIsDown = true;
  });
  window.addEventListener("mouseup", () => {
    if (currentChange.length) {
      while (changes.length > MAX_UNDO) {
        changes.shift();
      }
      changes.push(currentChange);
      currentChange = [];
    }
    mouseIsDown = false;
  });
  window.addEventListener("mousemove", (event) => {
    if (mouseIsDown) {
      let target = event.target;
      if (target.tagName === "TD") {
        if (target.style.backgroundColor !== document.getElementById("color").value) {
          currentChange.push({
            element: target,
            color: target.style.backgroundColor
          });
          target.style.backgroundColor = document.getElementById("color").value;
        }
      }
    }
  });
});

function undo() {
  let change = changes.pop();
  console.log(change);
  if (change) {
    for(let i = 0; i < change.length; i++) {
      change[i].element.style.backgroundColor = change[i].color;
    }
  }
}

window.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'z') {
    undo();
  }
});

function resizeTable() {
  let newRowsCount = parseInt(document.getElementById("table-rows").value, 10);
  let newColumnsCount = parseInt(document.getElementById("table-columns").value, 10);

  let currentRowsCount = table.rows.length;
  let currentColumnsCount = table.rows.length ? table.rows[0].cells.length : 0;

  let rowsChangeCount = newRowsCount - currentRowsCount;
  let columnsChangeCount = newColumnsCount - currentColumnsCount;

  // Adjust rows
  for(let i = 0; i < Math.abs(rowsChangeCount); i++) {
    if (rowsChangeCount > 0) {
      let newRow = table.insertRow();
      for(let j = 0; j < currentColumnsCount; j++) {
        newRow.insertCell();
        // set its background color to transparent
        newRow.cells[j].style.backgroundColor = "rgb(255, 255, 255)";
      }
    } else if (rowsChangeCount < 0) {
      table.deleteRow(-1);
    }
  }

  // Adjust columns
  for(let i = 0; i < table.rows.length; i++) {
    for(let j = 0; j < Math.abs(columnsChangeCount); j++) {
      if (columnsChangeCount > 0) {
        table.rows[i].insertCell();
        // set its background color to transparent
        table.rows[i].cells[table.rows[i].cells.length - 1].style.backgroundColor = "rgb(255, 255, 255)";
      } else if (columnsChangeCount < 0) {
        table.rows[i].deleteCell(-1);
      }
    }
  }
}

function tableTo2dArray() {
  let colors = [];
  for(let i = 0; i < table.rows.length; i++) {
    colors[i] = [];
    for(let j = 0; j < table.rows[i].cells.length; j++) {
      colors[i][j] = table.rows[i].cells[j].style.backgroundColor;
    }
  }
  return colors;
}

function saveFile() {
  let data = {};
  data.rows = table.rows.length;
  data.columns = table.rows[0].cells.length;
  data.colors = tableTo2dArray();
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "knit-save.poo");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function loadFile() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.poo';
  input.onchange = e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent => {
      let content = readerEvent.target.result;
      let data = JSON.parse(content);
      document.getElementById("table-rows").value = data.rows;
      document.getElementById("table-columns").value = data.columns;
      resizeTable();
      for(let i = 0; i < table.rows.length; i++) {
        for(let j = 0; j < table.rows[i].cells.length; j++) {
          table.rows[i].cells[j].style.backgroundColor = data.colors[i][j];
        }
      }
    }
  }
  input.click();
}

function center() {
  let colors = tableTo2dArray();
  let rows = parseInt(document.getElementById("table-rows").value, 10);
  let columns = parseInt(document.getElementById("table-columns").value, 10);
  

  // Step 1: Find the bounding box of the colored object.
  let minRow = rows, maxRow = -1, minCol = columns, maxCol = -1;

  for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
          if (colors[r][c] !== "rgb(255, 255, 255)") {
              minRow = Math.min(minRow, r);
              maxRow = Math.max(maxRow, r);
              minCol = Math.min(minCol, c);
              maxCol = Math.max(maxCol, c);
          }
      }
  }

  // Step 2: Find the center of the bounding box.
  let boxCenterRow = Math.floor((minRow + maxRow) / 2);
  let boxCenterCol = Math.floor((minCol + maxCol) / 2);

  // Step 3: Calculate the displacement needed.
  let rowDisplacement = Math.floor(rows / 2) - boxCenterRow;
  let colDisplacement = Math.floor(columns / 2) - boxCenterCol;

  // Step 4: Create a new array with the colored object at the center.
  let newColors = Array.from({ length: rows }, () => Array(columns).fill("rgb(255, 255, 255)"));

  for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
          let newRow = r + rowDisplacement;
          let newCol = c + colDisplacement;

          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
              newColors[newRow][newCol] = colors[r][c];
          }
      }
  }

  colors = newColors;  // Assigning the re-centered array back to `colors`


  for(let i = 0; i < table.rows.length; i++) {
    for(let j = 0; j < table.rows[i].cells.length; j++) {
      table.rows[i].cells[j].style.backgroundColor = newColors[i][j];
    }
  }

  changes = [];
}
