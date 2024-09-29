#server.py
from fastapi import FastAPI  
from fastapi.staticfiles import StaticFiles  
from fastapi.responses import HTMLResponse  
import os  

app = FastAPI()  

# Configure static files  
app.mount("/static", StaticFiles(directory="D:/VS/.vscode/Web"), name="static")  

@app.get("/", response_class=HTMLResponse)  
async def read_root():  
    file_path = 'D:/VS/.vscode/Web/web.html'
    print(os.path.exists(file_path)) 
    try:  
        with open(file_path, 'r', encoding='utf-8') as f:  
            return f.read()  
    except FileNotFoundError:  
        return HTMLResponse(content="404 Not Found: The requested file was not found.", status_code=404)  
    except Exception as e:  
        return HTMLResponse(content=f"500 Internal Server Error: {str(e)}", status_code=500)  

if __name__ == "__main__":  
    import uvicorn  
    uvicorn.run(app, host="0.0.0.0", port=3000)