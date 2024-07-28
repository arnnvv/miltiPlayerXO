"use client";
import { FC, useState, useEffect } from "react";
import { toast } from "sonner";

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

interface BoardProps {
  squares: (string | null)[];
  onClick: (i: number) => void;
}

const Square: FC<SquareProps> = ({
  value,
  onClick,
}: SquareProps): JSX.Element => (
  <button className="square" onClick={onClick}>
    {value}
  </button>
);

const Board: FC<BoardProps> = ({
  squares,
  onClick,
}: BoardProps): JSX.Element => {
  const renderSquare = (i: number): JSX.Element => (
    <Square value={squares[i]} onClick={(): void => onClick(i)} />
  );

  return (
    <div>
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
};

export default function Home({
  params,
}: {
  params: { roomId: string };
}): JSX.Element {
  const { roomId } = params;
  const [history, setHistory] = useState<(string | null)[][]>([
    Array(9).fill(null),
  ]);
  const [stepNumber, setStepNumber] = useState<number>(0);
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [isturn, setIsturn] = useState<boolean | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", roomId }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "move") {
        setHistory(data.state.history);
        setStepNumber(data.state.stepNumber);
        setXIsNext(data.state.xIsNext);
        setIsturn(true);
      }
    };
    setWs(socket);
    return () => socket.close();
  }, [roomId]);

  const calculateWinner = (squares: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i in lines) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
        return squares[a];
    }
    return null;
  };

  const jumpTo = (step: number): void => {
    setStepNumber(step);
    setXIsNext(step % 2 === 0);
  };

  const current = history[stepNumber];
  const winner = calculateWinner(current);

  const moves = history.map(
    (step: (string | null)[], move: number): JSX.Element => {
      const desc = move ? `Go to move #${move}` : "Go to game start";
      return (
        <li key={move}>
          <button onClick={(): void => jumpTo(move)}>{desc}</button>
        </li>
      );
    },
  );

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else {
    status = `Next player: ${xIsNext ? "X" : "O"}`;
  }

  return (
    <div className="game">
      <p>{roomId}</p>
      <style jsx global>{`
        .square {
          background: #fff;
          border: 1px solid #999;
          float: left;
          font-size: 24px;
          font-weight: bold;
          line-height: 34px;
          height: 34px;
          margin-right: -1px;
          margin-top: -1px;
          padding: 0;
          text-align: center;
          width: 34px;
        }

        .board-row:after {
          clear: both;
          content: "";
          display: table;
        }

        .game {
          display: flex;
          flex-direction: row;
        }

        .game-info {
          margin-left: 20px;
        }
      `}</style>
      <div className="game-board">
        <Board
          squares={current}
          onClick={(i: number): void => {
            if (isturn === false) toast.error("W8 for turn");
            else {
              const newHistory = history.slice(0, stepNumber + 1);
              const current = newHistory[newHistory.length - 1];
              const squares = current.slice();
              if (calculateWinner(squares) || squares[i]) {
                return;
              }
              squares[i] = xIsNext ? "X" : "O";
              const newState = {
                history: newHistory.concat([squares]),
                stepNumber: newHistory.length,
                xIsNext: !xIsNext,
              };
              setHistory(newState.history);
              setStepNumber(newState.stepNumber);
              setXIsNext(newState.xIsNext);

              if (ws && ws.readyState === WebSocket.OPEN)
                ws.send(
                  JSON.stringify({ type: "move", roomId, state: newState }),
                );
              setIsturn(false);
            }
          }}
        />
      </div>
      <div className="game-info">
        <div>{status}</div>
        <ol>{moves}</ol>
      </div>
    </div>
  );
}
