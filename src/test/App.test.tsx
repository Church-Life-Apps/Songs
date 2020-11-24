import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';
import { act } from 'react-dom/test-utils';

test('renders without crashing', () => {
  let baseElement;
  
  act(() => {
     baseElement = render(<App />);
  });

  expect(baseElement).toBeDefined();
});
