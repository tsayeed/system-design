const { createHash } = require("crypto")
const http = require("http")


const servers = {

}

class Server {
    constructor(key){
        this.objects = new Map()
        this.key = key
    }
    addObject(obj){
        this.objects.set(obj.key, obj)
    }
}

class ServerPool {
    constructor(){
        this.servers = []
    }

    addServer(server){
        const hashed_key = hash(server.key)
        console.log(`Server hash: ${hashed_key}`)
        this.servers.push([hashed_key, server])
        this.servers.sort((a, b) => {
            if (a < b) return -1
            else if (a == b) return 0
            else return 1
        })
    }
    removeServer(server){}
    findServerForObject(obj){
        const hashed_key = hash(obj.key)
        console.log(`Object Hash: ${hashed_key}`)
        const result = this.servers.find(([server_key_hash]) => server_key_hash > hashed_key)
        const [server_hash, server] = result ?? this.servers[0]
        console.log(`Found server ${server.key}: ${server_hash}`)
        return server
    }
}

const serverPool = new ServerPool()

function hash(key){
    const h = createHash('md5')
    h.write(key)
    return h.digest('hex')
}


async function addServer(req, res){
    const server = new Server(req.body)
    serverPool.addServer(server)
    servers[server.key] = server
    res.writeHead(200).end("Server Added")
}

async function addObject(req, res){
    const obj = {key: req.body}
    const server = serverPool.findServerForObject(obj)
    server.addObject(obj)
    res.writeHead(200).end(`Object Added to Server ${server.key}`)
}

async function getBody(req){
    const buffers = [];

    for await (const chunk of req) {
        buffers.push(chunk);
    }

    return Buffer.concat(buffers).toString('utf-8');

}


const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`)
    res.setHeader('Content-Type', 'text/plain')

    switch(url.pathname){
        case '/add-server':
            await addServer({body: await getBody(req), query: url.searchParams}, res)
            break
        case '/add-object':
            await addObject({body: await getBody(req), query: url.searchParams}, res)
            break
        default:
            res.writeHead(404).end('Action Not Found\n')
    }
    
})

server.listen(3000)

