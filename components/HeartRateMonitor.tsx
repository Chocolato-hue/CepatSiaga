"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function HeartRateMonitor() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 100;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll("*").remove();

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Number of points in the line
    const n = 100;

    // EKG pattern generator
    const generateEKG = () => {
      let data = Array(n).fill(0);
      return data.map((_, i) => {
        // Base line is 0. 
        // We inject QRS complexes at regular intervals.
        if (i % 30 === 0) return 0.2; // P wave
        if (i % 30 === 2) return -0.3; // Q wave
        if (i % 30 === 3) return 1.5; // R wave
        if (i % 30 === 4) return -0.5; // S wave
        if (i % 30 === 8) return 0.4; // T wave
        return (Math.random() - 0.5) * 0.1; // Baseline noise
      });
    };

    let data = generateEKG();

    const x = d3.scaleLinear().domain([0, n - 1]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([-1.5, 2]).range([innerHeight, 0]);

    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#FF3B30")
      .attr("stroke-width", 2)
      .attr("d", line);

    let animationFrameId: number;

    const tick = () => {
      // Shift data to the left
      data.push(data.shift() as number);
      
      // Occasionally introduce a new QRS complex for randomness if we were generating it dynamically,
      // but here we just shift an existing array for simplicity and continuous looping.

      path.attr("d", line);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <div ref={containerRef} className="w-full opacity-60" />;
}
