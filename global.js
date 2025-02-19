async function loadData() {

    const maleData = await d3.csv('data/male_medians.csv', d => ({
        minute: +d.time, 
        temperature: +d.median_activity, 
    }));

    const femaleData = await d3.csv('data/fem_medians.csv', d => ({
        minute: +d.time, 
        temperature: +d.median_activity, 
    }));

    
    const windowSize = 10; 


    const smoothedMaleData = calculateRollingAverage(maleData, windowSize);
    const smoothedFemaleData = calculateRollingAverage(femaleData, windowSize);

    const differenceData = calculateAbsoluteDifference(smoothedMaleData, smoothedFemaleData);


    createLinePlot(smoothedMaleData, smoothedFemaleData, differenceData);
}

function createLinePlot(smoothedMaleData, smoothedFemaleData, differenceData) {
    const margin = { top: 50, right: 200, bottom: 70, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    
    const x = d3.scaleLinear().domain([0, 1440]).range([0, width]);
    const y = d3.scaleLinear()
        .domain([d3.min([d3.min(smoothedMaleData, d => d.temperature), d3.min(smoothedFemaleData, d => d.temperature)]), 60])
        .range([height, 0]);

   
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(d3.range(0, 1441, 120)).tickFormat(d => `${Math.floor(d / 60)}:00`));

    svg.append('g').call(d3.axisLeft(y));

    svg.append('g').attr('class', 'gridlines').call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(10))
        .selectAll('line').style('stroke', '#ccc').style('stroke-opacity', 0.8);

    svg.append('text').attr('x', width / 4.5).attr('y', -margin.top / 4).attr('text-anchor', 'middle').style('font-size', '16px')
        .text('Lights Off');

    svg.append('text').attr('x', width / 1.35).attr('y', -margin.top / 4).attr('text-anchor', 'middle').style('font-size', '16px')
        .text('Lights On');

    svg.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').style('font-size', '14px')
        .text('Time (Hours)');

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', -margin.left + 20).attr('x', -height / 2).attr('text-anchor', 'middle')
        .style('font-size', '14px').text('Median Activity');

    svg.append('line').attr('x1', x(720)).attr('x2', x(720)).attr('y1', 0).attr('y2', height).attr('stroke', 'black')
        .attr('stroke-width', 2).attr('stroke-dasharray', '5,5');

    
    svg.append('rect')
        .attr('x', x(0))
        .attr('y', 0)
        .attr('width', x(720)) 
        .attr('height', height)
        .style('fill', 'lightgrey')
        .style('opacity', 0.6);

    const maleLine = svg.append('path').data([smoothedMaleData]).attr('class', 'line').attr('d', d3.line().x(d => x(d.minute)).y(d => y(d.temperature)))
        .style('stroke', '#1f77b4').style('stroke-width', 2.5).style('fill', 'none');

    const femaleLine = svg.append('path').data([smoothedFemaleData]).attr('class', 'line').attr('d', d3.line().x(d => x(d.minute)).y(d => y(d.temperature)))
        .style('stroke', '#ff7f0e').style('stroke-width', 2.5).style('fill', 'none');

    const differenceLine = svg.append('path').data([differenceData]).attr('class', 'line').attr('d', d3.line().x(d => x(d.minute)).y(d => y(d.temperature)))
        .style('stroke', '#2ca02c').style('stroke-width', 2.5).style('fill', 'none');

    svg.append('path')
        .data([differenceData])
        .attr('class', 'shaded-area')
        .attr('d', d3.area().x(d => x(d.minute)).y0(height).y1(d => y(d.temperature)))
        .style('fill', '#2ca02c')
        .style('fill-opacity', 0.3);

    const legendContainer = d3.select('body').append('div').attr('class', 'legend')
        .style('position', 'absolute')
        .style('top', `${margin.top + 150}px`)
        .style('left', `${width + margin.left + 85}px`);

    legendContainer.append('div').attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #1f77b4;"></span> Male Activity`);

    legendContainer.append('div').attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #ff7f0e;"></span> Female Activity`);

    legendContainer.append('div').attr('class', 'legend-item')
        .html(`<span class="swatch" style="background-color: #2ca02c;"></span> Absolute Activity Difference`);

    const dropdown = legendContainer.append('select').attr('id', 'legend-dropdown');
    dropdown.append('option').text('All').attr('value', 'all');
    dropdown.append('option').text('Male Activity Only').attr('value', 'male');
    dropdown.append('option').text('Female Activity Only').attr('value', 'female');
    dropdown.append('option').text('Absolute Activity Difference Only').attr('value', 'difference');

    dropdown.on('change', function() {
        const selectedValue = this.value;
        if (selectedValue === 'male') {
            maleLine.style('display', 'inline');
            femaleLine.style('display', 'none');
            differenceLine.style('display', 'none');
            svg.selectAll('.shaded-area').style('display', 'none');
        } else if (selectedValue === 'female') {
            maleLine.style('display', 'none');
            femaleLine.style('display', 'inline');
            differenceLine.style('display', 'none');
            svg.selectAll('.shaded-area').style('display', 'none');
        } else if (selectedValue === 'difference') {
            maleLine.style('display', 'none');
            femaleLine.style('display', 'none');
            differenceLine.style('display', 'inline');
            svg.selectAll('.shaded-area').style('display', 'inline');
        } else {
            maleLine.style('display', 'inline');
            femaleLine.style('display', 'inline');
            differenceLine.style('display', 'inline');
            svg.selectAll('.shaded-area').style('display', 'inline');
        }
    });
}




document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

function calculateRollingAverage(data, windowSize) {
    const smoothedData = [];

    for (let i = 0; i < data.length; i++) {
        const window = data.slice(Math.max(i - windowSize + 1, 0), i + 1);
        const avg = d3.mean(window, d => d.temperature);
        smoothedData.push({
            minute: data[i].minute,
            temperature: avg
        });
    }

    return smoothedData;
}

function calculateAbsoluteDifference(maleData, femaleData) {
    return maleData.map((d, i) => ({
        minute: d.minute,
        temperature: Math.abs(d.temperature - femaleData[i].temperature)
    }));
}
