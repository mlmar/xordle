export default function Lobby(props) {
  const { roomName, onStart } = props;
  return (
    <div className="flex flex-col flex-fill lobby">
      <h1> {roomName} </h1>
      <button onClick={onStart}> Start </button>
    </div>
  )
}