# Authentication Setup Guide

## Sistema de Login com Código (OTP)

O Taxis agora usa um sistema de autenticação com código de 6 dígitos ao invés de links por email. Isso melhora a segurança e evita problemas de spam.

## Configuração Necessária

### 1. Habilitar Anonymous Auth no Firebase

O sistema usa Firebase Anonymous Auth temporariamente durante o login. Para habilitar:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto **Taxis**
3. Vá em **Authentication** → **Sign-in method**
4. Habilite **Anonymous**
5. Clique em **Save**

### 2. Configurar Firestore Security Rules

Adicione estas regras no Firestore para permitir armazenamento de códigos:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Auth codes collection (temporary storage for OTP codes)
    match /authCodes/{email} {
      // Allow read/write for server-side operations only
      allow read, write: if true; // Temporary - replace with Cloud Functions
    }
  }
}
```

⚠️ **IMPORTANTE**: Por segurança, você deve migrar o armazenamento de códigos para Cloud Functions no futuro.

### 3. Integrar Serviço de Email

O sistema está pronto para enviar emails com códigos OTP. Você precisa integrar um serviço de email:

#### Opção 1: Firebase Extensions (Recomendado)

```bash
firebase ext:install firestore-send-email
```

Configure com:
- **SMTP Connection URI**: Seu servidor SMTP
- **Default FROM address**: `noreply@taxis.app` (ou seu domínio)

Atualize `services/authCodeService.ts` linha 78:

```typescript
export const sendCodeEmail = async (email: string, code: string): Promise<void> => {
  await setDoc(doc(db, 'mail', email), {
    to: email,
    message: {
      subject: 'Taxis - Your Login Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00ffff; text-align: center;">Taxis</h1>
          <h2>Your Login Code</h2>
          <p>Use this code to sign in to your Taxis account:</p>
          <div style="background: #1a1a1a; color: #00ffff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
        </div>
      `,
    },
  });
};
```

#### Opção 2: Resend (Simples e Moderno)

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCodeEmail = async (email: string, code: string): Promise<void> => {
  await resend.emails.send({
    from: 'Taxis <onboarding@taxis.app>',
    to: email,
    subject: 'Taxis - Your Login Code',
    html: `...` // Use o template acima
  });
};
```

#### Opção 3: SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendCodeEmail = async (email: string, code: string): Promise<void> => {
  await sgMail.send({
    to: email,
    from: 'noreply@taxis.app',
    subject: 'Taxis - Your Login Code',
    html: `...` // Use o template acima
  });
};
```

## Como Evitar que Emails Vão para Spam

### 1. Configure SPF Record

Adicione ao DNS do seu domínio:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

(Substitua com o SPF do seu provedor de email)

### 2. Configure DKIM

No seu provedor de email (SendGrid, Resend, etc.), gere as keys DKIM e adicione ao DNS:

```
Type: TXT
Name: default._domainkey
Value: (fornecido pelo provedor)
```

### 3. Configure DMARC

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@seu-dominio.com
```

### 4. Use um Domínio Personalizado

Emails de `@gmail.com` ou `@outlook.com` são frequentemente marcados como spam. Use um domínio próprio:
- `noreply@taxis.app`
- `auth@seu-dominio.com`

### 5. Template de Email Otimizado

O template já está otimizado para evitar spam:
- ✅ Texto simples e direto
- ✅ Sem muitos links
- ✅ Código em destaque
- ✅ Mensagem de expiração
- ✅ Instruções claras

## Fluxo de Autenticação

1. **Usuário insere email** → Sistema gera código de 6 dígitos
2. **Código é armazenado** → Firestore com expiração de 5 minutos
3. **Email é enviado** → Serviço de email envia o código
4. **Usuário insere código** → Sistema valida no Firestore
5. **Autenticação** → Firebase Anonymous Auth + criação de perfil
6. **Acesso ao app** → Usuário completa onboarding e acessa feed

## Desenvolvimento Local

Durante o desenvolvimento, os códigos são exibidos no console do navegador:

```
╔═══════════════════════════════════════════════╗
║         TAXIS LOGIN CODE                      ║
╠═══════════════════════════════════════════════╣
║  Email: user@example.com                      ║
║  Code:  123456                                ║
║  Expires in: 5 minutes                        ║
╚═══════════════════════════════════════════════╝
```

Abra o console do navegador (F12) para ver o código durante os testes.

## Segurança

- ✅ Códigos expiram em 5 minutos
- ✅ Códigos são de uso único (deletados após verificação)
- ✅ Máximo 6 dígitos numéricos
- ✅ Armazenamento temporário no Firestore
- ⚠️ **TODO**: Migrar para Cloud Functions para maior segurança
- ⚠️ **TODO**: Adicionar rate limiting para prevenir ataques de força bruta

## Próximos Passos

1. ✅ Sistema de códigos implementado
2. ✅ UI/UX otimizada
3. 🔄 Configurar serviço de email (em andamento)
4. 📋 Habilitar Anonymous Auth no Firebase
5. 📋 Configurar DNS (SPF, DKIM, DMARC)
6. 📋 Migrar para Cloud Functions (produção)
7. 📋 Adicionar rate limiting
8. 📋 Adicionar 2FA via SMS (já implementado, opcional)

## Suporte

Para questões sobre configuração, consulte a documentação do Firebase:
- [Firebase Anonymous Auth](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Extensions](https://firebase.google.com/products/extensions)
