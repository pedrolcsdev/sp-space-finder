## Plano: Exibir espaços por categoria na Home

Substituir a seção de "Categorias" (que hoje mostra apenas cards com ícone/descrição/link) por seções que exibem os espaços reais agrupados por categoria, similar à imagem de referência.

### Estrutura

Para cada categoria (`auditorium`, `dental`, `meeting`):

- Titulo da categoria + link "Ver mais >" alinhado à direita
- Grid de 3 colunas com os `SpaceCard` daquela categoria (limitado a 3)
- "Ver mais" linka para `/encontrar?category={id}`

### Dados mockados

Atualmente existem 3 espaços por categoria (9 total). Adicionar mais espaços mockados para ter pelo menos 4-5 por categoria, garantindo que os 3 exibidos sejam representativos.

### Mudanças no SpaceCard

Ajustar o card para ficar mais parecido com a referência:

- Layout mais limpo: imagem em cima, nome, localização com icone, capacidade com icone, recursos como badges com icones pequenos
- Remover o preço e botão "Ver detalhes" nessa visualização da home (ou manter opcional)

### Arquivos alterados

1. **`src/pages/Index.tsx`**: Substituir a seção "Categories" por seções agrupadas com cards reais
2. **`src/data/mockData.ts`**: Adicionar mais espaços para ter pelo menos 3 por categoria com variedade de localizações (como na referência: São Luís, Fortaleza, Belém, etc.)

### Mapeamento de categorias para nomes

- `auditorium` → "Auditórios"
- `dental` → "Salas Odontológicas"
- `meeting` → "Salas de Reunião"
