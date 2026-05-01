import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with themes and characters...');

  // Tema 1: Animais
  const animalTheme = await prisma.theme.create({
    data: {
      name: 'Animais',
      description: 'Adivinhe qual animal está pensando!',
      coverImageUrl: 'https://via.placeholder.com/300x200?text=Animais',
    },
  });

  await prisma.character.createMany({
    data: [
      {
        themeId: animalTheme.id,
        name: 'Leão',
        imageUrl: 'https://via.placeholder.com/200x200?text=Leão',
        attributes: JSON.stringify({ type: 'mamífero', cor: 'amarelo', tamanho: 'grande' }),
      },
      {
        themeId: animalTheme.id,
        name: 'Pinguim',
        imageUrl: 'https://via.placeholder.com/200x200?text=Pinguim',
        attributes: JSON.stringify({ type: 'ave', cor: 'preto', tamanho: 'pequeno' }),
      },
      {
        themeId: animalTheme.id,
        name: 'Girafa',
        imageUrl: 'https://via.placeholder.com/200x200?text=Girafa',
        attributes: JSON.stringify({ type: 'mamífero', cor: 'marrom', tamanho: 'grande' }),
      },
      {
        themeId: animalTheme.id,
        name: 'Polvo',
        imageUrl: 'https://via.placeholder.com/200x200?text=Polvo',
        attributes: JSON.stringify({ type: 'aquático', cor: 'roxo', tamanho: 'médio' }),
      },
      {
        themeId: animalTheme.id,
        name: 'Coelho',
        imageUrl: 'https://via.placeholder.com/200x200?text=Coelho',
        attributes: JSON.stringify({ type: 'mamífero', cor: 'branco', tamanho: 'pequeno' }),
      },
      {
        themeId: animalTheme.id,
        name: 'Elefante',
        imageUrl: 'https://via.placeholder.com/200x200?text=Elefante',
        attributes: JSON.stringify({ type: 'mamífero', cor: 'cinza', tamanho: 'grande' }),
      },
    ],
  });

  console.log(`✅ Tema "Animais" criado com 6 personagens`);

  // Tema 2: Filmes Clássicos
  const moviesTheme = await prisma.theme.create({
    data: {
      name: 'Filmes Clássicos',
      description: 'Adivinhe qual personagem de filme está aqui!',
      coverImageUrl: 'https://via.placeholder.com/300x200?text=Filmes',
    },
  });

  await prisma.character.createMany({
    data: [
      {
        themeId: moviesTheme.id,
        name: 'Homem Aranha',
        imageUrl: 'https://via.placeholder.com/200x200?text=Homem+Aranha',
        attributes: JSON.stringify({ tipo: 'super-herói', cor: 'vermelho' }),
      },
      {
        themeId: moviesTheme.id,
        name: 'Batman',
        imageUrl: 'https://via.placeholder.com/200x200?text=Batman',
        attributes: JSON.stringify({ tipo: 'super-herói', cor: 'preto' }),
      },
      {
        themeId: moviesTheme.id,
        name: 'Superman',
        imageUrl: 'https://via.placeholder.com/200x200?text=Superman',
        attributes: JSON.stringify({ tipo: 'super-herói', cor: 'azul' }),
      },
      {
        themeId: moviesTheme.id,
        name: 'Mulher Maravilha',
        imageUrl: 'https://via.placeholder.com/200x200?text=Mulher+Maravilha',
        attributes: JSON.stringify({ tipo: 'super-heroína', cor: 'vermelho' }),
      },
      {
        themeId: moviesTheme.id,
        name: 'Capitão América',
        imageUrl: 'https://via.placeholder.com/200x200?text=Capitão+América',
        attributes: JSON.stringify({ tipo: 'super-herói', cor: 'azul' }),
      },
      {
        themeId: moviesTheme.id,
        name: 'Viúva Negra',
        imageUrl: 'https://via.placeholder.com/200x200?text=Viúva+Negra',
        attributes: JSON.stringify({ tipo: 'super-heroína', cor: 'preto' }),
      },
    ],
  });

  console.log(`✅ Tema "Filmes Clássicos" criado com 6 personagens`);

  // Tema 3: Profissões
  const profissionsTheme = await prisma.theme.create({
    data: {
      name: 'Profissões',
      description: 'Adivinhe qual é a profissão!',
      coverImageUrl: 'https://via.placeholder.com/300x200?text=Profissões',
    },
  });

  await prisma.character.createMany({
    data: [
      {
        themeId: profissionsTheme.id,
        name: 'Médico',
        imageUrl: 'https://via.placeholder.com/200x200?text=Médico',
        attributes: JSON.stringify({ setor: 'saúde', uniforme: true }),
      },
      {
        themeId: profissionsTheme.id,
        name: 'Policial',
        imageUrl: 'https://via.placeholder.com/200x200?text=Policial',
        attributes: JSON.stringify({ setor: 'segurança', uniforme: true }),
      },
      {
        themeId: profissionsTheme.id,
        name: 'Astronauta',
        imageUrl: 'https://via.placeholder.com/200x200?text=Astronauta',
        attributes: JSON.stringify({ setor: 'espaço', uniforme: true }),
      },
      {
        themeId: profissionsTheme.id,
        name: 'Chef',
        imageUrl: 'https://via.placeholder.com/200x200?text=Chef',
        attributes: JSON.stringify({ setor: 'culinária', uniforme: true }),
      },
      {
        themeId: profissionsTheme.id,
        name: 'Piloto',
        imageUrl: 'https://via.placeholder.com/200x200?text=Piloto',
        attributes: JSON.stringify({ setor: 'aviação', uniforme: true }),
      },
      {
        themeId: profissionsTheme.id,
        name: 'Investigador',
        imageUrl: 'https://via.placeholder.com/200x200?text=Investigador',
        attributes: JSON.stringify({ setor: 'investigação', uniforme: false }),
      },
    ],
  });

  console.log(`✅ Tema "Profissões" criado com 6 personagens`);

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
