/**
 * History of signatures for /signature/history.
 * Claims in `paragraphs` are tied to the links in `sources`.
 * Do not add a fact here without a source that says it.
 */

export type HistorySource = { label: string; href: string; note?: string };
export type HistorySection = { id: string; kicker: string; title: string; paragraphs: string[]; sources: HistorySource[] };

export const HISTORY: HistorySection[] = [
  {
    id: 'seals',
    kicker: '01 · Before a name',
    title: 'Seals, and the mark that stood in for a person',
    paragraphs: [
      'A signature is a way of binding a person to a document. For a long time that way was not a handwritten name. In the ancient Near East, people rolled an engraved stone cylinder across wet clay. The Metropolitan Museum of Art’s essay on cylinder seals describes that impression as a practice running from the fourth millennium BCE well into the first millennium BCE. The seal identified an office or a person by a picture and, later, by writing, and it could be checked against the stone that made it.',
      'Medieval European documents were authenticated the same way in a later technology. The UK National Archives describe a seal as the impression of an engraved matrix, often pressed into wax, used to authenticate charters, letters and writs “in much the same way as we use signatures today.” A seal also closed a document, the way gum closes an envelope. The important fact for this page is the job, not the material: a repeatable mark, associated with a person or an office, stood in for the claim “this is from me.”',
    ],
    sources: [
      { label: 'The Metropolitan Museum of Art, “Cylinder Seals in the Ancient Near East”', href: 'https://www.metmuseum.org/essays/cylinder-seals-in-the-ancient-near-east' },
      { label: 'The National Archives (UK), research guide “Seals”', href: 'https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/seals/' },
    ],
  },
  {
    id: 'marks',
    kicker: '02 · A symbol, adopted on purpose',
    title: 'Marks, crosses, and the Statute of Frauds',
    paragraphs: [
      'When English law began to require writing, it did not require a particular handwriting. The Statute of Frauds, 29 Cha. 2 c. 3, passed in 1677, required certain agreements to be in writing and signed. It is about which promises must be written down. It does not define a signature as a cursive rendering of a name.',
      'American commercial law states the broader idea directly. In the Uniform Commercial Code’s general definitions, “signed” includes any symbol executed or adopted with the present intention to adopt or accept a writing. A cross, an initial, a stamp or a typed name can be a signature if the person meant it as one. Intention is the hinge. A mark made by accident is not a signature, and a beautiful autograph made as a joke or a practice stroke is not one either, unless the person adopted it for the document.',
    ],
    sources: [
      { label: 'Statute of Frauds, 1677 (29 Cha. 2 c. 3), legislation.gov.uk', href: 'https://www.legislation.gov.uk/aep/Cha2/29/3' },
      { label: 'Uniform Commercial Code § 1-201, definition of “signed”, Cornell LII', href: 'https://www.law.cornell.edu/ucc/1/1-201' },
    ],
  },
  {
    id: 'hancock',
    kicker: '03 · A name, written large',
    title: 'John Hancock and the parchment',
    paragraphs: [
      'The Continental Congress adopted the Declaration of Independence on July 4, 1776. That night John Dunlap printed a broadside. On the copies that survive, the printed authentication reads that it was signed by order and in behalf of the Congress by John Hancock, president, and attested by Charles Thomson, secretary. That is a printer’s line, not the famous sheet of signatures.',
      'On July 19, Congress ordered the Declaration “fairly engrossed on parchment.” Timothy Matlack wrote that official copy. The journal of the Continental Congress records the signing on August 2, 1776. John Hancock, president of Congress, signed the parchment first, with a bold signature centered under the text. Fifty-six delegates signed in the end. Not all of them were in the room on August 2. The National Archives tells this as the history of one physical document, ink and parchment included, not as a myth about the size of a name.',
      'Hancock’s name later became an American colloquialism for a person’s signature. Merriam-Webster records that sense. The parchment is the evidence. The idiom came after.',
    ],
    sources: [
      { label: 'National Archives, “The Declaration of Independence: A History”', href: 'https://www.archives.gov/founding-docs/declaration-history' },
      { label: 'National Archives, Declaration of Independence', href: 'https://www.archives.gov/founding-docs/declaration' },
      { label: 'Merriam-Webster, “John Hancock”', href: 'https://www.merriam-webster.com/dictionary/John%20Hancock' },
    ],
  },
  {
    id: 'notary',
    kicker: '04 · Someone else watches',
    title: 'Notarization is a different act',
    paragraphs: [
      'A signature and a notarization are easy to blur because they often happen in the same minute. They are not the same thing. In the United States a notary public is a state officer who takes acknowledgments, witnesses signatures and administers oaths, under that state’s law. Cornell’s legal encyclopedia describes the office that way. The National Notary Association, which trains notaries, says the same thing in its public explainer: the notary is identifying a signer and completing a notarial act, not becoming a party to the document.',
      'A civil-law notary, in many countries outside the common-law tradition, is a lawyer-like officer who drafts and archives instruments. A US notary is not that officer. PointCast does not commission notaries, and Signature Studio does not perform a notarial act. Watching yourself sign on your own laptop is not a notarization.',
    ],
    sources: [
      { label: 'Cornell Law School, Legal Information Institute, “notary public”', href: 'https://www.law.cornell.edu/wex/notary_public' },
      { label: 'National Notary Association, “What is a Notary Public?”', href: 'https://www.nationalnotary.org/knowledge-center/about-notaries/what-is-a-notary-public' },
    ],
  },
  {
    id: 'esign',
    kicker: '05 · Wet ink and the statutes',
    title: 'ESIGN, UETA, and what “electronic” means',
    paragraphs: [
      'A wet-ink signature is ink on a physical page. An electronic signature, in US federal law, is broader. The Electronic Signatures in Global and National Commerce Act, Public Law 106-229, was enacted on June 30, 2000. Section 101, now 15 U.S.C. § 7001, says that a signature, contract or other record relating to a transaction may not be denied legal effect, validity or enforceability solely because it is in electronic form, and that an electronic signature may not be denied legal effect solely because it is electronic. The statute also defines an electronic signature as a sound, symbol or process, attached to or logically associated with a contract or record, and executed or adopted by a person with intent to sign.',
      'The Act does not bless every click. It has exceptions. 15 U.S.C. § 7003 withholds the general rule from, among other things, wills, codicils and testamentary trusts, and from matters of adoption, divorce and other family law. There are further exceptions for certain notices: utility cutoffs, foreclosure, eviction, product recalls, hazardous materials. If a document matters, the exception list is part of the statute, not a footnote to skip.',
      'The Uniform Electronic Transactions Act is the state counterpart. The Uniform Law Commission approved it in 1999. It applies only in a state that has enacted it, and only when the parties have agreed to conduct that transaction by electronic means. New York did not enact UETA. It uses its own Electronic Signatures and Records Act. The Commission’s enactment chart is the list to trust, not a sentence on this page.',
      'Read together, the statutes care about intent, agreement to transact electronically, a way to attribute the signature to a person, and retention of the record. A PNG of a name, by itself, is none of those things. Signature Studio does not ask you to agree to a transaction, does not identify you, and does not keep a record for you. It is not an e-signature service.',
    ],
    sources: [
      { label: 'Public Law 106-229 (ESIGN Act), Congress.gov', href: 'https://www.congress.gov/106/plaws/publ229/PLAW-106publ229.pdf' },
      { label: '15 U.S.C. § 7001, Cornell LII', href: 'https://www.law.cornell.edu/uscode/text/15/7001' },
      { label: '15 U.S.C. § 7003 (exceptions), Cornell LII', href: 'https://www.law.cornell.edu/uscode/text/15/7003' },
      { label: 'Uniform Law Commission, Electronic Transactions Act', href: 'https://www.uniformlaws.org/committees/community-home?CommunityKey=2c04b76c-2b7d-4399-977e-d5876ba7e034' },
    ],
  },
  {
    id: 'crypto',
    kicker: '06 · A key, not a person',
    title: 'Digital signatures and public-key cryptography',
    paragraphs: [
      '“Electronic signature” and “digital signature” are not synonyms. The first is a legal category: a process someone adopts with intent to sign. The second is a cryptographic one: a mathematical operation with a private key that anyone with the matching public key can check.',
      'Whitfield Diffie and Martin Hellman introduced public-key cryptography in “New Directions in Cryptography” (IEEE Transactions on Information Theory, November 1976). They showed how two people can agree on a secret in public, and they sketched one-way authentication. Ronald Rivest, Adi Shamir and Leonard Adleman then published “A Method for Obtaining Digital Signatures and Public-Key Cryptosystems” (Communications of the ACM, February 1978). The title is the claim: a private operation that produces a signature, and a public operation that checks it, without the checker learning the private key.',
      'The US federal profile of those ideas is the Digital Signature Standard, FIPS 186, from NIST. The current revision, FIPS 186-5 (2023), approves RSA, ECDSA and EdDSA. Ed25519 is an EdDSA instance. Daniel J. Bernstein, Niels Duif, Tanja Lange, Peter Schwabe and Bo-Yin Yang specified the fast, high-security ed25519 construction in 2011. A valid ed25519 signature shows that the bytes were signed by the holder of a particular 32-byte private key. It does not show the holder’s name, unless some other system has bound that key to a name and you trust that binding.',
    ],
    sources: [
      { label: 'Diffie and Hellman, “New Directions in Cryptography” (1976)', href: 'https://ee.stanford.edu/~hellman/publications/24.pdf' },
      { label: 'Rivest, Shamir and Adleman, “A Method for Obtaining Digital Signatures and Public-Key Cryptosystems” (1978)', href: 'https://people.csail.mit.edu/rivest/Rsapaper.pdf' },
      { label: 'NIST FIPS 186-5, Digital Signature Standard (2023)', href: 'https://csrc.nist.gov/pubs/fips/186-5/final' },
      { label: 'Bernstein, Duif, Lange, Schwabe and Yang, Ed25519 (2011)', href: 'https://ed25519.cr.yp.to/ed25519-20110926.pdf' },
    ],
  },
  {
    id: 'wallets',
    kicker: '07 · A signature a wallet can make',
    title: 'Wallet signatures, Tezos, and this devnet',
    paragraphs: [
      'A cryptocurrency wallet signature is the same cryptographic object, used as a way to prove control of a key. On Ethereum, EIP-191 specifies how to sign a message so that it cannot be confused with a transaction. The signature still proves control of a key. It becomes a legal signature only if a law or a contract says that this process was adopted with intent to sign that record.',
      'On Tezos, a tz1 address is the hash of an ed25519 public key. The Tezos documentation describes the account types. Signing with that key shows control of the account. It does not, by itself, show a government identity.',
      'The PointCast devnet uses the same shape. Any ed25519 key is a tz1 account. The chain has no value and may reset. A post signed with a key made in Signature Studio is an accountable claim by that key: these bytes, this hash, sealed by one server at the time on its clock. It is not a wallet login to a bank, and it is not an edition mint. Edition mints on the devnet need the house attestor’s approval. The studio records a post instead, and it says so on the page.',
    ],
    sources: [
      { label: 'EIP-191: Signed Data Standard', href: 'https://eips.ethereum.org/EIPS/eip-191' },
      { label: 'Tezos documentation, accounts', href: 'https://docs.tezos.com/architecture/accounts' },
      { label: 'PointCast, how a bot and a key post to the devnet', href: 'https://pointcast.xyz/chain/bots/' },
    ],
  },
];

export const HISTORY_LINKS = HISTORY.flatMap((s) => s.sources.map((src) => src.href));
