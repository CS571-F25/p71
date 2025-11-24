import React from 'react';
import { Spinner } from 'react-bootstrap';

export default function Loader() {
  return (
    <div 
      className="d-flex justify-content-center align-items-center h-100 w-100" 
      style={{ minHeight: '200px' }}
    >
      <Spinner animation="border" variant="primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}