# IFSP Palestra

Projeto para gerenciamento de palestras, com frontend em Angular, backend em NestJS e banco de dados MySQL executado via Docker.

## Banco de Dados

Esta configuracao sobe dois containers:

- MySQL, responsavel pelo banco de dados da aplicacao.
- phpMyAdmin, usado para gerenciar o banco pelo navegador.

## Pre-requisitos

- Docker instalado.
- Docker Compose instalado.

## Subir os containers

Na raiz do projeto, execute:

```bash
docker compose up -d
```

## Verificar os containers

```bash
docker compose ps
```

## Dados de conexao do banco

- Host local: `localhost`
- Porta: `3306`
- Banco: `ifsp-palestra`
- Usuario: `ifsp-user-db`
- Senha: `ifsp-palestra-@12`

Para conectar a partir de outro container no mesmo `docker-compose.yml`, use o host `mysql`.

## Acessar o phpMyAdmin

Abra no navegador:

```text
http://localhost:8080
```

Use os seguintes dados:

- Servidor: `mysql`
- Usuario: `ifsp-user-db`
- Senha: `ifsp-palestra-@12`

## Parar os containers

```bash
docker compose down
```

## Remover containers e dados persistidos

Use este comando somente quando quiser apagar tambem os dados salvos no volume do MySQL:

```bash
docker compose down -v
```

## Validar a configuracao do Docker Compose

```bash
docker compose config
```
