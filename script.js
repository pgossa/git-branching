// Global variables for GitgraphJS state, action history, and settings.
let gitgraph, branches, currentBranch;
let actions = []; // Array to store commands for replaying
let graphSettings = { orientation: 'horizontal' }; // Graph settings
let commandHistory = []; // Stores executed commands for navigation
let historyIndex = -1; // Tracks the current position in command history


const graphContainer = document.getElementById("graph-container");
const terminalInput = document.getElementById("terminal-input");
const terminalHistory = document.getElementById("terminal-history");
const rerenderBtn = document.getElementById("rerender-btn");
const orientationSelect = document.getElementById("orientation-select");

// Initialize the Gitgraph with the current orientation.
function initGraph() {
  // Clear the container and reinitialize the graph.
  graphContainer.innerHTML = "";
  gitgraph = GitgraphJS.createGitgraph(graphContainer, { orientation: graphSettings.orientation });
  branches = {};
  // Create the default master branch with an initial commit.
  branches.master = gitgraph.branch("master");
  branches.master.commit("Initial commit");
  currentBranch = branches.master;
}

// Rebuild the graph from scratch by replaying the recorded actions.
function rebuildGraph() {
  initGraph();
  // Replay each recorded action to rebuild the current state.
  actions.forEach(action => {
    switch (action.cmd) {
      case "commit":
        currentBranch.commit(action.message);
        break;
      case "branch":
        branches[action.branchName] = currentBranch.branch(action.branchName);
        break;
      case "checkout":
        if (branches[action.branchName]) {
          currentBranch = branches[action.branchName];
        }
        break;
      case "merge":
        if (branches[action.branchName]) {
          currentBranch.merge(branches[action.branchName]);
        }
        break;
      case "tag":
        currentBranch.tag(action.tagName);
        break;
      default:
        // Unknown command; do nothing.
        break;
    }
  });
}

// Utility: Append a new line to the terminal history.
function addHistoryLine(text) {
  const commandLine = document.createElement("div");
  commandLine.classList.add("command-line");
  commandLine.textContent = `$ ${text}`;
  terminalHistory.appendChild(commandLine);
  terminalHistory.scrollTop = terminalHistory.scrollHeight;
}

// Utility: Trim quotes from around a string if present.
function trimQuotes(str) {
  return str.replace(/^['"]|['"]$/g, "");
}

// Command parser and executor.
function executeCommand(commandText) {
  addHistoryLine(commandText);

  // Simple split of command by spaces while respecting quoted text.
  const parts = commandText.match(/(?:[^\s"]+|"[^"]*")+/g);
  if (!parts || parts.length === 0) {
    return;
  }

  const command = parts[0].toLowerCase();

  switch (command) {
    case "commit":
      if (parts.length < 2) {
        addHistoryLine("Error: commit message required.");
        return;
      }
      const commitMessage = trimQuotes(parts.slice(1).join(" "));
      currentBranch.commit(commitMessage);
      actions.push({ cmd: "commit", message: commitMessage });
      addHistoryLine(`Committed on ${getCurrentBranchName()}: "${commitMessage}"`);
      break;

    case "branch":
      if (parts.length < 2) {
        addHistoryLine("Error: branch name required.");
        return;
      }
      const newBranchName = parts[1];
      if (branches[newBranchName]) {
        addHistoryLine(`Error: branch "${newBranchName}" already exists.`);
        return;
      }
      branches[newBranchName] = currentBranch.branch(newBranchName);
      actions.push({ cmd: "branch", branchName: newBranchName });
      addHistoryLine(`Created branch "${newBranchName}" from ${getCurrentBranchName()}.`);
      break;

    case "checkout":
      if (parts.length < 2) {
        addHistoryLine("Error: branch name required for checkout.");
        return;
      }
      const checkoutBranch = parts[1];
      if (!branches[checkoutBranch]) {
        addHistoryLine(`Error: branch "${checkoutBranch}" does not exist.`);
        return;
      }
      currentBranch = branches[checkoutBranch];
      actions.push({ cmd: "checkout", branchName: checkoutBranch });
      addHistoryLine(`Switched to branch "${checkoutBranch}".`);
      break;

    case "merge":
      if (parts.length < 2) {
        addHistoryLine("Error: branch name required for merge.");
        return;
      }
      const mergeBranchName = parts[1];
      if (!branches[mergeBranchName]) {
        addHistoryLine(`Error: branch "${mergeBranchName}" does not exist.`);
        return;
      }
      currentBranch.merge(branches[mergeBranchName]);
      actions.push({ cmd: "merge", branchName: mergeBranchName });
      addHistoryLine(`Merged branch "${mergeBranchName}" into ${getCurrentBranchName()}.`);
      break;

    case "tag":
      if (parts.length < 2) {
        addHistoryLine("Error: tag name required.");
        return;
      }
      const tagName = parts[1];
      currentBranch.tag(tagName);
      actions.push({ cmd: "tag", tagName: tagName });
      addHistoryLine(`Tagged ${getCurrentBranchName()} with "${tagName}".`);
      break;

    case "undo":
      if (actions.length === 0) {
        addHistoryLine("Nothing to undo.");
      } else {
        const removed = actions.pop();
        rebuildGraph();
        addHistoryLine(`Undid last command: ${removed.cmd}`);
      }
      break;

    case "reset":
      actions = [];
      rebuildGraph();
      addHistoryLine("Graph reset to initial state.");
      break;

    default:
      addHistoryLine(`Error: command "${command}" not recognized.`);
      break;
  }
}

// Helper: Get the current branch name.
function getCurrentBranchName() {
  for (const name in branches) {
    if (branches[name] === currentBranch) {
      return name;
    }
  }
  return "unknown";
}

// Listen for keydown events on the terminal input box.
terminalInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    const command = terminalInput.value.trim();
    if (command !== "") {
      executeCommand(command);
    }
    terminalInput.value = ""; // Clear the input after processing
    event.preventDefault();
  }
  // Handle command history navigation.
  else if (event.key === "ArrowUp") {
    // If there is a previous command, set the input to that command.
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
    }
    event.preventDefault();
  }
  else if (event.key === "ArrowDown") {
    // Move forward in the history if possible.
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
    } else {
      // If at the end, clear the input.
      historyIndex = commandHistory.length;
    terminalInput.value = "";
    }
    event.preventDefault();
  }
});

// Listen for clicks on the "Re-render Graph" button.
rerenderBtn.addEventListener("click", function() {
  rebuildGraph();
  addHistoryLine("Graph re-rendered.");
});

// Listen for changes in the orientation select control.
orientationSelect.addEventListener("change", function() {
  graphSettings.orientation = orientationSelect.value;
  rebuildGraph();
  addHistoryLine(`Graph orientation set to "${graphSettings.orientation}".`);
});

// Initialize the graph on page load.
initGraph();
