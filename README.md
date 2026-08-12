# Plataforma de produtos — MVP

Loja mobile-first com página de produto (galeria, oferta com contador real, variações,
quantidade, botão fixo de compra) + painel administrativo (produtos, pedidos,
dashboard) + redirecionamento para o checkout externo já existente.

Este é o **MVP (fase 1)** de um escopo maior — ver [Roadmap](#roadmap--fora-do-escopo-desta-fase).

## Stack

- **Next.js 16** (App Router, TypeScript) + React 19
- **Tailwind CSS v4** — design tokens em `src/app/globals.css`
- **Prisma 7** — schema em `prisma/schema.prisma`. **Postgres (Neon)**, provisionado
  via a integração Neon↔Vercel. `DATABASE_URL` (pooled, PgBouncer) é usada em
  runtime pela aplicação; `DATABASE_URL_UNPOOLED` (conexão direta) é usada só pelo
  Prisma CLI para migrações, já que o pooler do Neon não suporta os advisory locks
  que o Prisma Migrate precisa.
- **jose** (JWT) + **bcryptjs** — sessão de admin via cookie httpOnly assinado
- **zod** — validação de entrada em toda API

## Como rodar

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL / DATABASE_URL_UNPOOLED (Neon) e gere um SESSION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npx prisma migrate dev    # aplica o schema no Postgres
npx prisma db seed        # cria o admin e um produto DEMO
npm run dev
```

Se o projeto já está linkado à Vercel (`npx vercel link`), dá pra puxar as variáveis
reais em vez de preencher manualmente: `npx vercel env pull .env`.

- Loja: http://localhost:3000
- Produto demo: http://localhost:3000/produto/kit-sensorial-de-bolso-demo
- Admin: http://localhost:3000/admin (login criado pelo seed — veja o e-mail/senha
  impressos no terminal, definidos por `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` no
  `.env`; **troque a senha assim que possível**, não há tela de troca de senha nesta
  fase — atualize direto no banco ou via `prisma studio`)

## Integração com o checkout externo — o que foi verificado, não presumido

O checkout de referência (`https://pagseguropix.org/c/produto-teste-checkout`) foi
inspecionado diretamente (headers HTTP, `robots.txt`, HTML renderizado) antes de
qualquer decisão de integração:

- `X-Matched-Path: /c/[slug]` — é uma rota dinâmica Next.js. O `robots.txt` revela que
  a plataforma real por trás do domínio é `bravopay.club` (um SaaS de criação de
  páginas de checkout), com rotas próprias de `/admin`, `/dashboard`, `/onboarding` —
  não pertencem a este projeto.
- A página renderiza conteúdo **fixo** (nome do produto, preço, frete) sem parâmetros
  de query, campos ocultos ou JavaScript que leia produto/preço/quantidade da URL.
- **Conclusão: não existe um contrato de integração parametrizável.** Cada checkout é
  uma página pré-construída manualmente naquele SaaS, com sua própria slug fixa.

Por isso, a integração implementada é a única tecnicamente sustentável: cada produto
(e opcionalmente cada variação) tem um campo `checkoutUrl` configurável no admin,
apontando para a página de checkout já criada na plataforma. **Nenhum parâmetro de
preço, produto ou quantidade é enviado por URL** — o que seria inventado e não
confiável.

Consequência direta: **não há webhook nem API de confirmação de pagamento
disponível**. Um pedido é criado com status `PENDING` no momento em que o cliente é
enviado ao checkout (`POST /api/checkout/start`); todo status além disso
(`PAID`, `SHIPPED` etc.) é definido **manualmente** por um admin na tela de Pedidos,
nunca inferido automaticamente. Isso está documentado no código
(`prisma/schema.prisma`, `src/app/api/admin/orders/[id]/route.ts`) para que não seja
reintroduzido como uma sincronização "fake" no futuro.

## Segurança do preço — a regra que guia toda a arquitetura

O cliente nunca envia preço. `POST /api/checkout/start` recebe apenas
`productId` + `variantId` + `quantity`; preço, estoque e a URL de checkout são
sempre recalculados a partir do banco (`src/lib/pricing.ts:resolveEffectiveProduct`).
Testado manualmente: enviar `priceCents`/`totalCents` tampados no corpo da requisição
não tem efeito — o pedido criado sempre reflete o preço real do produto/variação.

## Arquitetura

```
src/
  app/
    page.tsx                      catálogo (home)
    produto/[slug]/page.tsx       página de produto (server component)
    admin/
      login/page.tsx
      (dashboard)/                grupo de rotas com sidebar — login fica fora dele
        page.tsx                  dashboard (polling 5s)
        products/                 lista, criar, editar
        orders/                   lista + atualização manual de status
    api/
      checkout/start/             único lugar que cria um Order
      admin/{login,logout}/
      admin/products/[...]/       CRUD + duplicar (soft delete)
      admin/orders/[id]/          atualização manual de status
      admin/dashboard/            métricas (polling)
      admin/upload/               upload de imagem com allowlist de MIME
  components/
    product/                      Header, Gallery, OfferBanner, PriceBlock,
                                   VariantSelector, QuantitySelector, StickyBuyBar…
    admin/                        AdminNav, ProductForm (abas)
  lib/
    pricing.ts                    única fonte de verdade: preço/estoque/checkout
                                   efetivos dado produto + variação selecionada
    product-service.ts            toda lógica de criar/editar/duplicar produto
    auth.ts / proxy.ts            sessão de admin (JWT em cookie) + gate de rotas
    validation.ts                 schemas zod (entrada de toda API)
    constants.ts                  status controlados (Product/Order) — única fonte
    money.ts                      dinheiro sempre em centavos inteiros
prisma/
  schema.prisma                   modelo de dados (comentado com as decisões acima)
  seed.ts                         cria admin + produto DEMO
```

`src/proxy.ts` é o middleware do Next 16 (renomeado de `middleware.ts` — convenção
atual do framework). Protege `/admin/*` e `/api/admin/*` no servidor; esconder botões
no client não é autorização.

## Deploy (Vercel)

Projeto linkado via `npx vercel link --project shopee-oferta`. `DATABASE_URL` (e as
demais variáveis do Neon) já são injetadas automaticamente pela integração
Neon↔Vercel; `SESSION_SECRET` foi adicionada manualmente com `npx vercel env add`
(valores diferentes em produção/preview vs. development). O `postinstall: "prisma
generate"` no `package.json` é o que faz o build da Vercel gerar o client do Prisma
antes do `next build` — sem isso o build falha com `Module not found:
'@/generated/prisma/client'`, já que esse diretório é gerado e fica fora do Git.

## Roadmap / fora do escopo desta fase

Definido com o dono do produto como MVP-first. Ainda não implementado:

- Cupons, adicionais de produto (`ProductAddon`), depoimentos, avaliações de
  clientes (schema tem campos agregados `ratingAverage`/`ratingCount`, mas não uma
  tabela `reviews` com moderação)
- Múltiplos endereços de cliente / conta de cliente (o checkout externo já coleta
  esses dados — não haveria onde usá-los hoje)
- SEO avançado por produto (campos de meta title/description dedicados — hoje deriva
  de `name`/`shortDescription`)
- Testes automatizados (unitários/integração/E2E)
- CI/CD

## Testes realizados manualmente (fluxo completo)

- Login admin: senha errada → 401; senha certa → sessão criada; `/admin` sem sessão →
  redireciona para `/admin/login`
- `POST /api/checkout/start`: compra válida cria `Order` com preço do servidor;
  variação sem estoque → 409; quantidade acima do estoque → 409/400; sem variação
  selecionada em produto com variações → 400; `priceCents`/`totalCents` enviados pelo
  cliente são ignorados (confirmado inspecionando o pedido criado)
- Upload: arquivo `text/plain` disfarçado → 415 (rejeitado pela allowlist de MIME)
- `npm run build`, `npm run lint`, `npx tsc --noEmit` — sem erros
