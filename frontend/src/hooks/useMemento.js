import { useState, useCallback } from 'react';

// The Memento
class Memento {
  constructor(state) {
    this.state = state;
  }

  getState() {
    return this.state;
  }
}

// The Caretaker, implemented as a custom hook
export const useMemento = (initialState) => {
  const [history, setHistory] = useState([new Memento(initialState)]);
  const [index, setIndex] = useState(0);

  const setState = useCallback((newState) => {
    // Create a memento of the new state
    const newMemento = new Memento(newState);

    // Add the new memento to the history, clearing any "redo" history
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, index + 1);
      newHistory.push(newMemento);
      return newHistory;
    });

    // Move the index to the new state
    setIndex((prevIndex) => prevIndex + 1);
  }, [index]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex((prevIndex) => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex((prevIndex) => prevIndex + 1);
    }
  }, [index, history.length]);

  const reset = useCallback((newState) => {
    setHistory([new Memento(newState)]);
    setIndex(0);
  }, []);

  return {
    state: history[index].getState(),
    setState,
    reset,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
