import { useState } from "react";

function PatientScreen() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleClick = () => {
    if (!name.trim()) {
      setMessage("Please enter your name");
    } else {
      setMessage(`Hello, ${name} 👋`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80 text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Vite + React + Tailwind
        </h1>

        <input
          type="text"
          placeholder="Enter your name"
          className="w-full mt-5 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleClick}
          className="w-full mt-4 bg-indigo-600 text-white p-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Greet
        </button>

        {message && (
          <p className="mt-4 font-semibold text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}

export default PatientScreen;
