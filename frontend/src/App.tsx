import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { HomePage } from "./components/homePgae"
import { CallingPage } from "./components/callingPage"


function App() {

  return (
    <div className='min-h-screen bg-slate-950'>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/onCall" element={<CallingPage />} />
        </Routes>
    </BrowserRouter><ToastContainer />
    </div>
  )
}

export default App
