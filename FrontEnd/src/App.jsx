import React from 'react';
import FloatingDockDesktop from './components/FloatingDockDesktop';

const App = () => {
  return (
    <div>
      <div className='bg-black min-h-screen w-full select-none'>
        <div className='h-screen p-4 w-full flex justify-center items-center flex-col'>
          <div className='text-blue-500 tracking-loose tracking-tighter text-6xl font-["Nueue-Montrel"]'>COLLAB-CODE</div>
          <div className='text-blue-900 pl-50'>....development in progress</div>
        </div>
        
        <FloatingDockDesktop 
          className="fixed bottom-20 left-1/2 -translate-x-1/2" 
        />
      </div>
    </div>
  );
};

export default App;