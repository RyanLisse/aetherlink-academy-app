// Deck domain model, ported from the agent-native `slides` template
// (shared/api.ts, shared/aspect-ratios.ts, server/db/schema.ts) and expressed
// as Effect Schema so persistence, HTTP and MCP share one validated contract.
import {Schema} from 'effect';

export const ASPECT_RATIOS={
 '16:9':{width:960,height:540},
 '4:3':{width:960,height:720},
 '1:1':{width:1080,height:1080},
 '9:16':{width:540,height:960},
 '4:5':{width:864,height:1080},
} as const;
export const AspectRatio=Schema.Literal('16:9','4:3','1:1','9:16','4:5');
export type AspectRatio=typeof AspectRatio.Type;
export const DEFAULT_ASPECT_RATIO:AspectRatio='16:9';
export const aspectRatioDims=(ratio:AspectRatio|undefined|null)=>ASPECT_RATIOS[ratio&&ratio in ASPECT_RATIOS?ratio:DEFAULT_ASPECT_RATIO];

export const Layout=Schema.Literal('title','content','two-column','image','blank');
export type Layout=typeof Layout.Type;
export const Transition=Schema.Literal('instant','none','fade','slide','zoom');
export type Transition=typeof Transition.Type;

const Text=(max:number)=>Schema.String.pipe(Schema.maxLength(max));
export const SlideId=Schema.String.pipe(Schema.pattern(/^[A-Za-z0-9_-]{1,64}$/));
export const DeckId=Schema.UUID;

const Ordinal=(max:number)=>Schema.Int.pipe(Schema.between(0,max));
const Minutes=Schema.Int.pipe(Schema.between(1,120));
/** Safe subset of the classroom deck's `visual` options (packages/deck source-visuals). Unknown keys are dropped. */
export const ClassroomVisual=Schema.Struct({
 bot:Schema.optional(Schema.Literal('wave','think','point','head')),
 place:Schema.optional(Schema.Literal('left','beside','under')),
 quiz:Schema.optional(Schema.Struct({answer:Ordinal(11)})),
 reveal:Schema.optional(Schema.Literal('click')),
 stepThrough:Schema.optional(Schema.Literal(true)),
 stagger:Schema.optional(Schema.Literal('pop')),
 spotlight:Schema.optional(Ordinal(11)),
 hero:Schema.optional(Ordinal(11)),
 checklist:Schema.optional(Ordinal(11)),
 countdown:Schema.optional(Minutes),
 quietTimer:Schema.optional(Minutes),
 stepKeys:Schema.optional(Schema.Boolean),
 recapKeys:Schema.optional(Schema.Boolean),
 levelUp:Schema.optional(Schema.Boolean),
 pairs:Schema.optional(Schema.Boolean),
 oneCol:Schema.optional(Schema.Boolean),
 phrase:Schema.optional(Text(300)),
 highlight:Schema.optional(Schema.Array(Schema.Struct({in:Schema.Union(Schema.Literal('title','subtitle','tagline'),Schema.String.pipe(Schema.pattern(/^card:\d{1,2}$/))),text:Text(200).pipe(Schema.minLength(1)),tone:Schema.Literal('orange','purple','mark')})).pipe(Schema.maxItems(6))),
});
export const ClassroomType=Schema.Literal('context','concept','practice','review','quiz','recap','pause');
export const ClassroomLayout=Schema.Literal('cards','pillars','steps','compare','exercise','recap');
/** Structured classroom slide (aetherlink-classroom-slides field reference), rendered by @academy/deck. */
export const ClassroomSlide=Schema.Struct({
 title:Text(300).pipe(Schema.minLength(1)),
 kicker:Schema.optional(Text(120)),
 subtitle:Schema.optional(Text(600)),
 type:Schema.optional(ClassroomType),
 layout:Schema.optional(ClassroomLayout),
 dark:Schema.optional(Schema.Boolean),
 hidden:Schema.optional(Schema.Boolean),
 cards:Schema.optional(Schema.Array(Schema.Struct({title:Text(200),body:Text(1_500)})).pipe(Schema.maxItems(12))),
 items:Schema.optional(Schema.Array(Schema.Struct({label:Text(200),caption:Schema.optional(Text(400)),detail:Schema.optional(Text(1_500))})).pipe(Schema.maxItems(12))),
 columns:Schema.optional(Schema.Array(Schema.Struct({title:Text(200),items:Schema.Array(Text(500)).pipe(Schema.maxItems(12)),foot:Schema.optional(Text(400))})).pipe(Schema.maxItems(4))),
 steps:Schema.optional(Schema.Array(Text(500)).pipe(Schema.maxItems(12))),
 stepsHeading:Schema.optional(Text(200)),
 expected:Schema.optional(Text(600)),
 check:Schema.optional(Text(600)),
 prompt:Schema.optional(Text(4_000)),
 tagline:Schema.optional(Text(300)),
 keyPoints:Schema.optional(Schema.Array(Text(200)).pipe(Schema.maxItems(8))),
 visual:Schema.optional(ClassroomVisual),
});
export type ClassroomSlide=typeof ClassroomSlide.Type;

/** A slide's HTML is the unit of authoring; notes are presenter-only. `classroom` is the structured source when present. */
export class Slide extends Schema.Class<Slide>('Slide')({
 id:SlideId,
 content:Text(200_000),
 notes:Schema.optionalWith(Text(20_000),{default:()=>''}),
 layout:Schema.optionalWith(Layout,{default:()=>'content' as const}),
 background:Schema.optional(Text(200)),
 transition:Schema.optional(Transition),
 classroom:Schema.optional(ClassroomSlide),
}){}

/** Design-system tokens the renderer exposes as `--ds-*` variables. */
export class DesignSystem extends Schema.Class<DesignSystem>('DesignSystem')({
 bg:Schema.optional(Text(100)),
 surface:Schema.optional(Text(100)),
 text:Schema.optional(Text(100)),
 textMuted:Schema.optional(Text(100)),
 accent:Schema.optional(Text(100)),
 headingFont:Schema.optional(Text(200)),
 bodyFont:Schema.optional(Text(200)),
 radius:Schema.optional(Text(40)),
}){}

export const Author=Schema.Struct({id:Text(100),name:Text(100)});
export class Deck extends Schema.Class<Deck>('Deck')({
 id:DeckId,
 roomId:Schema.UUID,
 title:Text(200),
 aspectRatio:Schema.optionalWith(AspectRatio,{default:()=>DEFAULT_ASPECT_RATIO}),
 slides:Schema.Array(Slide),
 designSystem:Schema.optional(DesignSystem),
 revision:Schema.Int.pipe(Schema.greaterThanOrEqualTo(1)),
 createdBy:Author,
 createdAt:Schema.String,
 updatedAt:Schema.String,
}){}
export const decodeDeck=Schema.decodeUnknown(Deck);
export const encodeDeck=Schema.encodeSync(Deck);

// ---- Action inputs ----------------------------------------------------------

export const SlideInput=Schema.Struct({
 id:Schema.optional(SlideId),
 content:Schema.optional(Text(200_000)),
 heading:Schema.optional(Text(300)),
 body:Schema.optional(Schema.Array(Text(1_000)).pipe(Schema.maxItems(12))),
 label:Schema.optional(Text(120)),
 notes:Schema.optional(Text(20_000)),
 layout:Schema.optional(Layout),
 background:Schema.optional(Text(200)),
 transition:Schema.optional(Transition),
 classroom:Schema.optional(ClassroomSlide),
});
export type SlideInput=typeof SlideInput.Type;

export const CreateDeckInput=Schema.Struct({
 title:Text(200).pipe(Schema.minLength(1)),
 aspectRatio:Schema.optional(AspectRatio),
 slides:Schema.optionalWith(Schema.Array(SlideInput).pipe(Schema.maxItems(200)),{default:()=>[]}),
 designSystem:Schema.optional(DesignSystem),
});

export const AddSlideInput=Schema.Struct({
 deckId:DeckId,
 afterSlideId:Schema.optional(SlideId),
 expectedRevision:Schema.optional(Schema.Int),
 ...SlideInput.fields,
});

const EditBase={required:Schema.optional(Schema.Boolean),expectedMatches:Schema.optional(Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)))};
export const SlideEdit=Schema.Union(
 Schema.Struct({op:Schema.optional(Schema.Literal('replace')),find:Text(50_000).pipe(Schema.minLength(1)),replace:Text(200_000),occurrence:Schema.optional(Schema.Int.pipe(Schema.greaterThanOrEqualTo(1))),all:Schema.optional(Schema.Boolean),...EditBase}),
 Schema.Struct({op:Schema.Literal('insert-before','insert-after'),find:Text(50_000).pipe(Schema.minLength(1)),content:Text(200_000),...EditBase}),
 Schema.Struct({op:Schema.Literal('replace-between'),start:Text(50_000).pipe(Schema.minLength(1)),end:Text(50_000).pipe(Schema.minLength(1)),replace:Text(200_000),...EditBase}),
 Schema.Struct({op:Schema.Literal('regex-replace'),pattern:Text(2_000).pipe(Schema.minLength(1)),flags:Schema.optional(Schema.String.pipe(Schema.pattern(/^[gimsuy]*$/))),replace:Text(200_000),all:Schema.optional(Schema.Boolean),...EditBase}),
);
export type SlideEdit=typeof SlideEdit.Type;

export const UpdateSlideInput=Schema.Struct({
 deckId:DeckId,
 slideId:SlideId,
 edits:Schema.optional(Schema.Array(SlideEdit).pipe(Schema.minItems(1),Schema.maxItems(50))),
 fullContent:Schema.optional(Text(200_000)),
 notes:Schema.optional(Text(20_000)),
 baseContentHash:Schema.optional(Schema.String),
});

export const SlideFields=Schema.Struct({
 content:Schema.optional(Text(200_000)),
 classroom:Schema.optional(ClassroomSlide),
 notes:Schema.optional(Text(20_000)),
 layout:Schema.optional(Layout),
 background:Schema.optional(Text(200)),
 transition:Schema.optional(Transition),
});
export const DeckOperation=Schema.Union(
 Schema.Struct({op:Schema.Literal('patch-slide'),slideId:SlideId,fields:SlideFields}),
 Schema.Struct({op:Schema.Literal('delete-slide'),slideId:SlideId}),
 Schema.Struct({op:Schema.Literal('reorder-slides'),slideIds:Schema.Array(SlideId).pipe(Schema.minItems(1))}),
 Schema.Struct({op:Schema.Literal('add-slide'),slide:SlideInput,afterSlideId:Schema.optional(SlideId)}),
 Schema.Struct({op:Schema.Literal('patch-deck-fields'),fields:Schema.Struct({title:Schema.optional(Text(200).pipe(Schema.minLength(1))),aspectRatio:Schema.optional(AspectRatio),designSystem:Schema.optional(DesignSystem)})}),
);
export type DeckOperation=typeof DeckOperation.Type;

export const PatchDeckInput=Schema.Struct({
 deckId:DeckId,
 expectedRevision:Schema.optional(Schema.Int),
 operations:Schema.Array(DeckOperation).pipe(Schema.minItems(1),Schema.maxItems(200)),
});

export const GetDeckInput=Schema.Struct({
 deckId:DeckId,
 slideId:Schema.optional(SlideId),
 compact:Schema.optional(Schema.Boolean),
});
export const DeckIdInput=Schema.Struct({deckId:DeckId});
