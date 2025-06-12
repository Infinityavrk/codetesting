// generate_report.js
const fs = require('fs');
const path = require('path');
const os = require('os');

function generateHtml(results) {
    const totalFiles = results.length;
    const totalTime = 0; // Placeholder. If you want, record start & end time in scanner.js and pass it.

    const severityData = { Critical: 0, Medium: 0, Low: 0 };
    const typeCounts = {};

    let html = `
    <html>
    <head>
        <title>CodeGuardian Report</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f2f2f2; padding: 20px; }
            h1, h2 { text-align: center; color: #333; }
            .chart-row { display: flex; justify-content: space-around; gap: 20px; margin-bottom: 40px; }
            .chart-container { flex: 1; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .file { font-weight: bold; margin-top: 20px; color: #333; }
            .box { margin: 1em 0; padding: 1em; border-left: 6px solid; background: white; border-radius: 6px; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
            .critical { border-color: #b30000; }
            .severe { border-color: orange; }
            .moderate { border-color: gold; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>📊 CodeGuardian Analysis Report</h1>
        <p><strong>Total Files Scanned:</strong> ${totalFiles}</p>
        <p><strong>Total Time Taken:</strong> ${totalTime.toFixed(2)} seconds</p>
        <div class="chart-row">
            <div class="chart-container">
                <canvas id="severityChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="typeChart" style="max-height: 300px;"></canvas>
            </div>
        </div>
        <script>
            const severityData = { Critical: 0, Medium: 0, Low: 0 };
            const typeCounts = {};
        </script>
    `;

    let details = '';

    results.forEach(result => {
        details += `<div class="file">📄 ${result.file}</div>`;
        result.vulnerabilities.forEach(v => {
            const severity = 'High'; // Hardcoded as per your current scanner output
            const colorClass = severity === 'High' ? 'critical' : severity === 'Medium' ? 'severe' : 'moderate';

            details += `<div class="box ${colorClass}">
                <div><strong>Type:</strong> ${v.type}</div>
                <div><strong>Severity:</strong> ${severity}</div>
                <div><strong>Line:</strong> ${v.line}</div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px;">
                    <div style="flex: 1; min-width: 300px;">
                        <strong>🔴 Vulnerable Code:</strong>
                        <pre>${v.original || 'N/A'}</pre>
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <strong>✅ Suggested Fix:</strong>
                        <pre>${v.fix}</pre>
                    </div>
                </div>
            </div>`;

            // Update chart data
            html += `<script>
                severityData['${severity === 'High' ? 'Critical' : severity}']++;
                typeCounts['${v.type}'] = (typeCounts['${v.type}'] || 0) + 1;
            </script>`;
        });
    });

    html += `
    <script>
        const sevCtx = document.getElementById('severityChart').getContext('2d');
        new Chart(sevCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(severityData),
                datasets: [{
                    label: 'Vulnerabilities by Severity',
                    data: Object.values(severityData),
                    backgroundColor: ['#b30000', 'orange', 'gold']
                }]
            }
        });

        const typeCtx = document.getElementById('typeChart').getContext('2d');
        const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);

        new Chart(typeCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(typeCounts),
                datasets: [{
                    label: 'Vulnerability Types',
                    data: Object.values(typeCounts),
                    backgroundColor: Object.keys(typeCounts).map((_, i) => {
                        return 'hsl(' + (i * 40) + ', 70%, 60%)';
                    })
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const value = ctx.raw;
                                const percent = ((value / total) * 100).toFixed(1);
                                return ctx.label + ': ' + value + ' (' + percent + '%)';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Vulnerabilities by Type'
                    }
                }
            }
        });
    </script>
    <hr/>
    <div style="padding:20px">${details}</div>
    </body>
    </html>`;

    return html;
}

// MAIN EXECUTION
const jsonPath = path.join(__dirname, 'vuln-report.json');
if (!fs.existsSync(jsonPath)) {
    console.error('❌ vuln-report.json not found');
    process.exit(1);
}

const results = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const reportHtml = generateHtml(results);

const outputPath = path.join(os.tmpdir(), 'codeguardian-report.html');
fs.writeFileSync(outputPath, reportHtml);
console.log(`✅ Report generated at: ${outputPath}`);
