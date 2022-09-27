# Overview


# Diffusion Communicator

The diffusion communicator sits on the Windows machine with the only exposed port via a permanent SSH tunnel to the VPS. It listens to authenticated requests from the discord bot which hits localhost:27720 and then forwards these requests to the fastapi wrapper on top of Stable Diffusion. 


