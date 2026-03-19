{/* eslint-disable react/no-unescaped-entities */}
import React from 'react';
import Head from 'next/head';

export default function Privacidade() {
  return (
    <>
      <Head>
        <title>Política de Privacidade - Meta Ads Manager</title>
        <meta name="description" content="Política de Privacidade do Meta Ads Manager" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-blue-100">Meta Ads Manager</p>
            <p className="text-blue-100 text-sm mt-2">
              Última atualização: 19 de março de 2026
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Introdução */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              O Meta Ads Manager ("Aplicação", "nós", "nosso") respeita a privacidade de seus usuários.
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e armazenamos as
              informações que você nos fornece ao usar nossa aplicação integrada com o Facebook/Meta.
            </p>
          </section>

          {/* Quem Somos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Quem Somos</h2>
            <p className="text-gray-700 leading-relaxed">
              Meta Ads Manager é um aplicativo desenvolvido para gerenciar campanhas de publicidade
              no Meta (anteriormente Facebook). Somos responsáveis pelo tratamento de dados pessoais
              que você nos confia.
            </p>
          </section>

          {/* Dados Coletados */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Quais Informações Coletamos do Facebook/Meta
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Para fornecer serviços de gerenciamento de anúncios, nossa aplicação solicita acesso às
              seguintes informações da sua conta do Facebook/Meta:
            </p>

            <div className="bg-gray-50 border-l-4 border-blue-600 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissões Solicitadas:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>ads_read:</strong> Acesso somente leitura a campanhas, conjuntos de anúncios,
                    anúncios e insights de desempenho (sem autorização para modificar)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>ads_management:</strong> Permissão para criar, editar e gerenciar campanhas,
                    conjuntos de anúncios e anúncios em suas contas de publicidade
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>business_management:</strong> Acesso para gerenciar contas de publicidade
                    e informações relacionadas ao seu Business Manager
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>email:</strong> Seu endereço de email para identificação e comunicação
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>public_profile:</strong> Informações básicas de perfil (nome, foto, email)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 font-bold">•</span>
                  <span>
                    <strong>pages_read_engagement:</strong> Acesso a páginas do Facebook que você gerencia
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Dados Específicos Coletados:</strong>
            </p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li>✓ ID da sua conta do Facebook</li>
              <li>✓ Nome da conta de publicidade</li>
              <li>✓ Seu nome e email</li>
              <li>✓ Contas de publicidade vinculadas a você</li>
              <li>✓ Páginas do Facebook que você gerencia</li>
              <li>✓ Pixels de conversão associados às suas contas</li>
              <li>✓ Campanhas, conjuntos de anúncios e anúncios</li>
              <li>✓ Dados de desempenho e insights dos anúncios</li>
              <li>✓ Informações de audiência e segmentação</li>
            </ul>
          </section>

          {/* Como Usamos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Como Usamos Suas Informações
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Usamos as informações coletadas exclusivamente para os seguintes fins:
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Prestação de Serviços</h3>
                <p className="text-gray-700">
                  Gerenciar, criar e otimizar suas campanhas de publicidade no Meta de forma segura e eficiente.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📈 Análise de Desempenho</h3>
                <p className="text-gray-700">
                  Mostrar relatórios e insights sobre o desempenho de seus anúncios para ajudá-lo
                  a tomar decisões informadas.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">🔐 Segurança</h3>
                <p className="text-gray-700">
                  Detectar, prevenir e resolver fraudes ou problemas de segurança em sua conta.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">💬 Comunicação</h3>
                <p className="text-gray-700">
                  Enviar notificações importantes sobre sua conta, atualizações e suporte técnico.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">⚖️ Conformidade Legal</h3>
                <p className="text-gray-700">
                  Cumprir com leis, regulamentos e solicitações de autoridades competentes.
                </p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-6 text-sm italic">
              ⚠️ <strong>Importante:</strong> Nós NUNCA usamos seus dados para fins comerciais, não vendemos
              suas informações e não as compartilhamos com terceiros sem seu consentimento explícito.
            </p>
          </section>

          {/* Compartilhamento de Dados */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Compartilhamento de Dados</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Com o Facebook/Meta</h3>
              <p className="text-gray-700 leading-relaxed">
                Para fornecer nossos serviços, compartilhamos informações necessárias com o Meta através de suas APIs autorizadas.
                Este compartilhamento é realizado de acordo com os Termos de Serviço do Meta e nossa integração autorizada.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Com Provedores de Serviço</h3>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos prestadores de serviço terceirizados apenas quando estritamente necessário para:
              </p>
              <ul className="mt-3 ml-4 space-y-2 text-gray-700">
                <li>• Hospedagem e armazenamento seguro de dados (Supabase)</li>
                <li>• Processamento de requisições de API (Vercel)</li>
                <li>• Operações de infraestrutura e segurança</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                Todos os provedores de serviço assinam acordos de confidencialidade e estão proibidos de usar
                suas informações para qualquer outro fim.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sem Venda de Dados</h3>
              <p className="text-gray-700 leading-relaxed font-semibold text-red-600">
                ❌ Nós NÃO vendemos, compartilhamos ou alugamos suas informações pessoais para fins comerciais.
              </p>
            </div>
          </section>

          {/* Segurança */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Segurança de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li>✓ Criptografia SSL/TLS para transmissão de dados</li>
              <li>✓ Autenticação JWT (JSON Web Tokens) segura</li>
              <li>✓ Controle de acesso baseado em papéis (RBAC)</li>
              <li>✓ Política de senhas fortes obrigatória</li>
              <li>✓ Auditoria de logs de acesso</li>
              <li>✓ Conformidade com LGPD (Lei Geral de Proteção de Dados)</li>
              <li>✓ Conformidade com GDPR (para usuários na UE)</li>
              <li>✓ Monitoramento contínuo de vulnerabilidades de segurança</li>
            </ul>
          </section>

          {/* Seus Direitos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seus Direitos e Controles</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              De acordo com a LGPD, GDPR e outras leis de proteção de dados, você tem o direito de:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">📋 Direito de Acesso</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Solicitar uma cópia de todas as informações que temos sobre você.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">✏️ Direito de Retificação</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Corrigir ou atualizar qualquer informação imprecisa que temos.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">🗑️ Direito ao Esquecimento (Exclusão)</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Solicitar a exclusão de seus dados pessoais (sob certas circunstâncias legais).
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">🚫 Direito de Oposição</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Opor-se ao processamento de seus dados para fins específicos.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">📊 Direito à Portabilidade</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Receber seus dados em um formato estruturado e transferível.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2">
                <h3 className="font-semibold text-gray-900">⏹️ Direito de Revogar Consentimento</h3>
                <p className="text-gray-700 text-sm mt-1">
                  Retirar o consentimento a qualquer momento, sem afetar a legalidade do processamento anterior.
                </p>
              </div>
            </div>
          </section>

          {/* Exclusão de Dados */}
          <section className="mb-12 bg-red-50 border-2 border-red-200 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-red-900 mb-6">
              8. Como Solicitar Exclusão de Seus Dados
            </h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                📝 Passo a Passo para Remover o Aplicativo e Seus Dados
              </h3>

              <div className="space-y-6">
                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <span className="text-2xl font-bold text-blue-600 mr-4">1</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Remova a Integração no Facebook</h4>
                      <ol className="list-decimal ml-5 text-gray-700 space-y-2 text-sm">
                        <li>Faça login em sua conta do Facebook</li>
                        <li>Acesse <strong>Configurações e Privacidade → Configurações</strong></li>
                        <li>Clique em <strong>Aplicativos e Websites</strong></li>
                        <li>Localize <strong>Meta Ads Manager</strong> na lista</li>
                        <li>Clique em <strong>Remover</strong> ou <strong>Desconectar</strong></li>
                        <li>Confirme a ação</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <span className="text-2xl font-bold text-blue-600 mr-4">2</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Envie uma Solicitação de Exclusão de Dados
                      </h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Após remover a integração, envie um email para:
                      </p>
                      <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-800">
                        privacidade@metaadsmanager.com.br
                      </div>
                      <p className="text-gray-700 text-sm mt-3">
                        <strong>Assunto:</strong> Solicitação de Exclusão de Dados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <span className="text-2xl font-bold text-blue-600 mr-4">3</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Informações Necessárias no Email
                      </h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Para processar sua solicitação rapidamente, inclua:
                      </p>
                      <ul className="text-gray-700 text-sm space-y-2">
                        <li>• Seu nome completo</li>
                        <li>• Email associado à conta</li>
                        <li>• ID da conta Meta/Facebook (encontrado em Configurações)</li>
                        <li>• Confirmação de que deseja excluir TODOS os seus dados</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <div className="flex items-start">
                    <span className="text-2xl font-bold text-blue-600 mr-4">4</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Confirmação de Exclusão</h4>
                      <p className="text-gray-700 text-sm">
                        Você receberá um email de confirmação em até <strong>30 dias úteis</strong> informando:
                      </p>
                      <ul className="text-gray-700 text-sm space-y-2 mt-3">
                        <li>✓ Data da exclusão processada</li>
                        <li>✓ Quais dados foram removidos</li>
                        <li>✓ Confirmação de que nenhum backup contém seus dados</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-gray-800">
                <strong>⏱️ Prazo de Resposta:</strong> Processaremos sua solicitação dentro de 30 dias.
                Você receberá uma confirmação por email após a conclusão.
              </p>
            </div>
          </section>

          {/* Período de Retenção */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Retemos seus dados pessoais apenas pelo tempo necessário para fornecer nossos serviços
              ou conforme exigido por lei:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded">
                <p className="font-semibold text-gray-900 mb-2">📊 Dados de Campanhas</p>
                <p className="text-sm text-gray-700">
                  Mantidos enquanto você usar o aplicativo. Deletados 90 dias após a remoção.
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded">
                <p className="font-semibold text-gray-900 mb-2">🔍 Logs de Acesso</p>
                <p className="text-sm text-gray-700">
                  Mantidos por 12 meses para fins de segurança e auditoria.
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded">
                <p className="font-semibold text-gray-900 mb-2">📝 Registros de Transações</p>
                <p className="text-sm text-gray-700">
                  Mantidos por 7 anos conforme requisitos fiscais e legais.
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded">
                <p className="font-semibold text-gray-900 mb-2">💬 Comunicações</p>
                <p className="text-sm text-gray-700">
                  Mantidas por 2 anos a menos que você solicite exclusão.
                </p>
              </div>
            </div>
          </section>

          {/* Menores de Idade */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Proteção de Menores</h2>
            <p className="text-gray-700 leading-relaxed">
              Meta Ads Manager é destinado apenas a usuários maiores de 18 anos. Não coletamos
              intencionalmente dados de menores de idade. Se descobrirmos que coletamos dados
              de menores, removeremos imediatamente essas informações.
            </p>
          </section>

          {/* Mudanças na Política */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Alterações Nesta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar esta Política de Privacidade de tempos em tempos. Notificaremos você
              sobre alterações significativas publicando a nova política nesta página e atualizando
              a data de Última atualização acima.
            </p>
          </section>

          {/* Contato */}
          <section className="mb-12 bg-blue-50 p-8 rounded-lg border-l-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Entre em Contato Conosco</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Se você tiver dúvidas sobre esta Política de Privacidade ou deseje exercer seus direitos,
              entre em contato conosco por:
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-2xl mr-4">📧</span>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-gray-700">
                    <a href="mailto:privacidade@metaadsmanager.com.br" className="text-blue-600 hover:underline">
                      privacidade@metaadsmanager.com.br
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-4">📋</span>
                <div>
                  <p className="font-semibold text-gray-900">Formulário de Solicitação</p>
                  <p className="text-gray-700">
                    Disponível em nossa plataforma após fazer login
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-4">⏱️</span>
                <div>
                  <p className="font-semibold text-gray-900">Tempo de Resposta</p>
                  <p className="text-gray-700">
                    Responseremos em até 10 dias úteis
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Conformidade Legal */}
          <section className="mb-12 bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Conformidade com Leis de Proteção de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Meta Ads Manager está em conformidade com:
            </p>
            <ul className="space-y-2 text-gray-700 ml-4">
              <li>✓ <strong>LGPD</strong> (Lei Geral de Proteção de Dados - Brasil)</li>
              <li>✓ <strong>GDPR</strong> (Regulamento Geral sobre Proteção de Dados - UE)</li>
              <li>✓ <strong>CCPA</strong> (California Consumer Privacy Act - EUA)</li>
              <li>✓ <strong>Meta Platform Terms</strong> (Termos da Plataforma Meta)</li>
            </ul>
          </section>

          {/* Rodapé */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p className="mb-2">
              Esta Política de Privacidade é válida e exigida para a conformidade com regulamentações
              da Meta para aplicativos em modo ativo.
            </p>
            <p>
              Última atualização: 19 de março de 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
