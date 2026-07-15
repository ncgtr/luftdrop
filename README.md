# LuftDrop
### Easy file sharing on your local network (Local Universal File Transfer), inspired by Apple AirDrop


<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/0912d804-e7c1-4686-af37-a1182b770ac0" height="400" alt="Web (Windows)">
    </td>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/3d8f97de-8594-4061-adf5-04200c10773b" height="400" alt="Web (iPad)">
    </td>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/c807ed62-52c7-459e-b585-ac95749b7c61" height="400" alt="Web (iPhone)">
    </td>
  </tr>
  <tr>
    <td align="center"><b>Web (Windows)</b></td>
    <td></td>
    <td align="center"><b>Web (iPad)</b></td>
    <td></td>
    <td align="center"><b>Web (iPhone)</b></td>
  </tr>
</table>

## Purpose
The purpose of **LuftDrop** is to eliminate the platform limitations of **AirDrop**, enabling reliable file sharing across all of your personal devices, regardless of their operating system.

## Framework
The application is built using **web technologies** for the frontend and **Python** for the backend, which powers the local server and handles file management.

## Required Python Libraries
- FastAPI: `fastapi`
- Python Multipart: `python-multipart`
- Jinja2: `jinja2`
- Uvicorn: `uvicorn`

## How It Works
The app's core functionality and logic is a **local, universal file archive** that allows any connected device to upload and download files. Uploaded files are stored on the host device, which acts as the server, and are immediately added to the shared archive. From there, every device on the local network can access and download any available file. Since the system operates entirely within a local network, it is not exposed to the security risks typically associated with internet-based file sharing.
