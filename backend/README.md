# Backend IFSP Palestra

API NestJS para cadastro de usuarios, autenticacao e gerenciamento de palestras.

## Configuracao

Instale as dependencias:

```bash
npm install
```

Crie um arquivo `.env` com base em `.env.example`.

Para usar o MySQL do `docker-compose.yml` da raiz, mantenha:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=ifsp-user-db
DB_PASSWORD=ifsp-palestra-@12
DB_DATABASE=ifsp-palestra
```

Defina um `JWT_SECRET` forte antes de usar fora do ambiente local.

## Executar

```bash
npm run start:dev
```

## Autenticacao

Endpoints protegidos exigem o header:

```text
Authorization: Bearer <accessToken>
```

## Endpoints publicos

- `POST /auth/register`: cadastra usuario.
- `POST /auth/login`: autentica usuario.

## Endpoints autenticados

- `GET /talks`: lista palestras com paginacao e filtros.
- `GET /talks/:id`: detalha palestra.
- `POST /talks/:id/enrollments`: inscreve o usuario autenticado.
- `DELETE /talks/:id/enrollments/me`: remove a propria inscricao.

## Endpoints de palestrante

- `GET /talks/mine`: lista palestras do palestrante autenticado.
- `POST /talks`: cadastra palestra.
- `PUT /talks/:id`: edita palestra do palestrante autenticado.
- `PATCH /talks/:id`: edita parcialmente palestra do palestrante autenticado.
- `DELETE /talks/:id`: deleta palestra do palestrante autenticado.
- `DELETE /talks/:id/enrollments/:userId`: remove inscricao de usuario da palestra.

## Filtros e paginacao

`GET /talks` e `GET /talks/mine` aceitam:

- `page`: pagina atual, padrao `1`.
- `limit`: itens por pagina, padrao `10`, maximo `100`.
- `search`: busca por titulo ou descricao.
- `date`: filtra por data no formato `YYYY-MM-DD`.

Exemplo:

```text
GET /talks?page=1&limit=10&search=nestjs&date=2026-06-09
```
