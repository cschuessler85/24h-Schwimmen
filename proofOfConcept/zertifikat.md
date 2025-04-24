# Flask mit https nutzen

## Zertifikat erstellen

Im Terminal ausführen

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

erzeugt cert.pem (Zertifikat) und key.pem (privater Schlüssel)

## Anpassung von Flask mit Zertifikat

```python
    #app.run(debug=True) #ohne SSL
    app.run(ssl_context=('cert.pem', 'key.pem'), debug=True)
```
