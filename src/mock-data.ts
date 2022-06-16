export const mockData = [
  {
    species: 'Dog',
    breedNames: [
      'Alsatian',
      'Great Dane',
      'Jack Russel',
      'Doberman',
      'Whipet',
      'Spaniel',
      'Red Setter',
    ],
  },
  {
    species: 'Cat',
    breedNames: [
      'Emotionally distant cat',
      'Aloof cat',
      'Unavailable cat',
      'Disinterested cat',
      'Judgemental cat',
      'Dog7',
    ],
  },
  {
    species: 'Bird',
    breedNames: [
      'Minah bird',
      'Sparrow',
      'Kingfisher',
      'Pelican',
      'Heron',
      'Parrot',
    ],
  },
  {
    species: 'Elephant',
    breedNames: ['African', 'Indian'],
  },
  {
    species: 'Slug',
    breedNames: ['Just a slug'],
  },
]

export const appData = {
  appName: 'Animals table',
  subTitle:
    'An exercise in creating a dynamically resizable table in Svelte.js. The Breed names column will render a string array of names. As the width of the table decreases the bred names will be hidden and replaced by a badge which will show the number of names that are not displayed.',
}
