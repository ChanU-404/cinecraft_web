
const fs = require('fs');
const path = require('path');

async function testPersistence() {
    const DATA_DIR = path.join(process.cwd(), 'data');
    const DB_PATH = path.join(DATA_DIR, 'projects.json');

    console.log("Checking if data dir exists...");
    if (!fs.existsSync(DATA_DIR)) {
        console.log("Data dir not found, creating...");
        fs.mkdirSync(DATA_DIR);
    }

    console.log("Reading DB...");
    let projects = [];
    if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        projects = JSON.parse(data);
    }
    console.log(`Found ${projects.length} existing projects.`);

    const testId = "test-" + Date.now();
    const testProject = {
        id: testId,
        title: "Persistence Test Project",
        lastModified: Date.now(),
        scenes: [{ id: "scene-1", summary: "Test Scene" }]
    };

    console.log("Saving test project...");
    projects.push(testProject);
    fs.writeFileSync(DB_PATH, JSON.stringify(projects, null, 2));

    console.log("Reading back...");
    const newData = fs.readFileSync(DB_PATH, 'utf-8');
    const newProjects = JSON.parse(newData);
    const found = newProjects.find(p => p.id === testId);

    if (found && found.title === "Persistence Test Project") {
        console.log("✅ Persistence Test PASSED: Project saved and retrieved.");
    } else {
        console.error("❌ Persistence Test FAILED: Project not found.");
        process.exit(1);
    }

    // Cleanup
    console.log("Cleaning up test project...");
    const cleanup = newProjects.filter(p => p.id !== testId);
    fs.writeFileSync(DB_PATH, JSON.stringify(cleanup, null, 2));
    console.log("Cleanup done.");
}

testPersistence();
