import http from 'node:http';

// Endpoint mínimo para healthcheck do Docker/monitoramento externo.
export function startHealthServer(client, port = Number(process.env.PORT) || 3000) {
  const server = http.createServer((req, res) => {
    if (req.url !== '/health') {
      res.writeHead(404).end();
      return;
    }

    const ready = client.isReady();
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: ready ? 'ok' : 'starting', ping: client.ws.ping }));
  });

  server.listen(port);
  return server;
}
