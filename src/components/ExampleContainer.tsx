import React from 'react';
import './ExampleContainer.css';

// For learning purposes only. Once we have a legit container, delete this.

interface ContainerProps {}

const ExampleContainer: React.FC<ContainerProps> = () => {
  return (
    <div className="container">
      <h2>Example Container</h2>
    </div>
  );
};

export default ExampleContainer;
