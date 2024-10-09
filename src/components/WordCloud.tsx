import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { useSpring, animated } from 'react-spring';

interface WordCloudProps {
  words: Array<{ text: string; value: number }>;
  width: number;
  height: number;
}

const WordCloud: React.FC<WordCloudProps> = ({ words, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const animProps = useSpring({
    opacity: words.length > 0 ? 1 : 0,
    transform: words.length > 0 ? 'scale(1)' : 'scale(0.5)',
  });

  useEffect(() => {
    if (!words.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cloudLayout = cloud()
      .size([width, height])
      .words(words.map(d => ({ ...d, size: 10 + d.value * 30 })))
      .padding(5)
      .rotate(() => (~~(Math.random() * 6) - 3) * 30)
      .font('Impact')
      .fontSize(d => (d as any).size)
      .on('end', draw);

    cloudLayout.start();

    function draw(words: d3.layout.cloud.Word[]) {
      const color = d3.scaleLinear<string>()
        .domain([0, words.length])
        .range(['#00ffff', '#ff00ff']);

      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      g.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Impact')
        .style('fill', (_, i) => color(i))
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text)
        .transition()
        .duration(1000)
        .style('opacity', 1);

      // Add pulsating animation
      g.selectAll('text')
        .on('mouseover', function(this: SVGTextElement) {
          d3.select(this)
            .transition()
            .duration(300)
            .style('font-size', d => `${(d as any).size * 1.2}px`)
            .style('fill', '#ffffff');
        })
        .on('mouseout', function(this: SVGTextElement, _, i) {
          d3.select(this)
            .transition()
            .duration(300)
            .style('font-size', d => `${(d as any).size}px`)
            .style('fill', color(i));
        });
    }
  }, [words, width, height]);

  return (
    <animated.div style={animProps} className="w-full h-full">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full" />
    </animated.div>
  );
};

export default WordCloud;