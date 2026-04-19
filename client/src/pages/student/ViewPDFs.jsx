import { useEffect, useState } from "react";
import axios from "axios";

export default function ViewPDFs() {
    const [pdfs, setPdfs] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/api/pdfs")
            .then(res => setPdfs(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>All PDFs</h2>

            {pdfs.map((pdf) => (
                <div key={pdf.id} style={{ marginBottom: "20px" }}>
                    <iframe
                        src={pdf.url}
                        width="100%"
                        height="400px"
                        title="PDF"
                    ></iframe>
                </div>
            ))}
        </div>
    );
}