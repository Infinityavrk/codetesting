// scanner.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const folderPath = process.argv[2]; // folder passed as CLI arg
const extensions = ['.js', '.java', '.cs'];

function getAllFilesInFolder(dir) {
    let files = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files = files.concat(getAllFilesInFolder(fullPath));
        } else if (extensions.includes(path.extname(fullPath)) && stat.size > 0) {
            files.push(fullPath);
        }
    });
    return files;
}

async function scanFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');

    const typeRes = await fetch('http://102.37.140.196:8000/detect-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const { vulnerability_types } = await typeRes.json();

    const [lineRes, fixRes] = await Promise.all([
        fetch('http://102.37.140.196:8000/detect-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, vulnerability_types })
        }),
        fetch('http://102.37.140.196:8000/fix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, vulnerability_types })
        })
    ]);

    const { vulnerable_lines } = await lineRes.json();
    const { suggested_fix } = await fixRes.json();

    return {
        file: filePath,
        vulnerabilities: vulnerability_types.map((type, i) => ({
            type,
            line: vulnerable_lines[i] || 'N/A',
            fix: suggested_fix
        }))
    };
}

async function main() {
    const files = getAllFilesInFolder(folderPath);
    const results = [];
    let hasVulnerabilities = false;

    for (const file of files) {
        try {
            const result = await scanFile(file);
            results.push(result);

            if (result.vulnerabilities.length > 0) {
                hasVulnerabilities = true;

                console.log(`\n🔍 Vulnerabilities found in file: ${file}`);
                result.vulnerabilities.forEach(vul => {
                    console.log(`  🔸 Type: ${vul.type}`);
                    console.log(`  🔹 Line: ${vul.line}`);
                    console.log(`  🛠️ Fix: ${vul.fix}`);
                    console.log('---------------------------');
                });
            }
        } catch (e) {
            console.error(`❌ Failed to scan ${file}: ${e.message}`);
        }
    }

    //fs.writeFileSync('vuln-report.json', JSON.stringify(results, null, 2));
    //console.log('\n📄 Report saved to vuln-report.json');

    if (hasVulnerabilities) {
        console.error('\n🚨 Vulnerabilities detected. Failing the build.');
        process.exit(1);
    } else {
        console.log('\n✅ No vulnerabilities found. Build safe to proceed.');
    }
}

main();
